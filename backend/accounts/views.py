from rest_framework import viewsets, permissions, decorators, response, status, views
from .models import User, Notification
from .serializers import UserSerializer, SignUpSerializer, NotificationSerializer
from school.models import SchoolConfiguration
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
import re

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # SAFETY: Never allow deleting the primary admin account
        if instance.username == 'admin' or instance.is_superuser:
            if not request.user.is_superuser:
                 return response.Response({"error": "Vous n'avez pas les droits pour supprimer un SuperAdmin."}, status=status.HTTP_403_FORBIDDEN)
            # Even for SuperAdmins, prevent deleting the ROOT admin to avoid lockout
            if instance.username == 'admin':
                return response.Response({"error": "Le compte SuperAdmin racine (admin) ne peut pas être supprimé pour des raisons de sécurité."}, status=status.HTTP_400_BAD_REQUEST)

        # Log cascade warning if owner
        if instance.role == 'admin' and instance.establishment:
            print(f"CRITICAL: User {instance.username} being deleted. Cascading to establishment {instance.establishment.name}")

        return super().destroy(request, *args, **kwargs)

    @decorators.action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        if request.method == 'PATCH':
            serializer = self.get_serializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return response.Response(serializer.data)
            return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(request.user)
        return response.Response(serializer.data)

    def perform_create(self, serializer):
        # Auto-assign establishment to new staff
        serializer.save(establishment=self.request.user.establishment)

    def get_serializer_class(self):
        if self.action == 'create':
            return SignUpSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        from tenants.models import get_current_tenant, is_tenant_bypassed
        
        # The 'admin' user (SuperAdmin) has dual-mode operation
        if user.is_superuser or user.username == 'admin':
            tenant = get_current_tenant()
            if tenant and not is_tenant_bypassed():
                # If impersonating a specific school, only show users of that school
                return User.objects.filter(establishment=tenant)
            # Default to seeing everything in global mode
            return User.all_objects.all()
        
        # All members of an establishment can see other members in that same establishment
        if user.establishment:
            return User.objects.filter(establishment=user.establishment)
        
        return User.objects.filter(id=user.id)

    @decorators.action(detail=False, methods=['get'])
    def establishments(self, request):
        if not (request.user.is_superuser or request.user.username == 'admin'):
            return response.Response({"error": "Unauthorized"}, status=403)
        
        from tenants.models import Establishment
        from tenants.serializers import EstablishmentSerializer
        # Explicitly use all_objects to bypass any filters for SuperAdmin lists
        estab_list = Establishment.objects.all()
        return response.Response(EstablishmentSerializer(estab_list, many=True).data)

    @decorators.action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        password_confirm = request.data.get('password_confirm')

        if new_password != password_confirm:
            return response.Response({"password_confirm": ["Les mots de passe ne correspondent pas."]}, status=status.HTTP_400_BAD_REQUEST)

        # Enforce School Password Policy
        config = SchoolConfiguration.objects.first()
        if config:
            if len(new_password) < config.min_password_length:
                return response.Response({"new_password": [f"Le mot de passe doit contenir au moins {config.min_password_length} caractères."]}, status=status.HTTP_400_BAD_REQUEST)
            
            if config.require_strong_password:
                if not re.search(r'[A-Z]', new_password):
                    return response.Response({"new_password": ["Le mot de passe doit contenir au moins une lettre majuscule."]}, status=status.HTTP_400_BAD_REQUEST)
                if not re.search(r'[0-9]', new_password):
                    return response.Response({"new_password": ["Le mot de passe doit contenir au moins un chiffre."]}, status=status.HTTP_400_BAD_REQUEST)
                if not re.search(r'[!@#$%^&*(),.?":{}|<>]', new_password):
                    return response.Response({"new_password": ["Le mot de passe doit contenir au moins un caractère spécial."]}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return response.Response({"old_password": ["Ancien mot de passe incorrect."]}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return response.Response({"message": "Mot de passe modifié avec succès."}, status=status.HTTP_200_OK)

class SignUpView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignUpSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return response.Response(serializer.data, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        user = User.objects.filter(username=username).first()
        
        if user and user.is_locked:
            raise serializers.ValidationError({"detail": "Votre compte est verrouillé suite à trop de tentatives infructueuses. Contactez l'administrateur."})

        # Block non-admins during maintenance
        config = None
        if user and user.establishment:
            config = SchoolConfiguration.all_objects.filter(establishment=user.establishment).first()
            
        if config and config.maintenance_mode:
            if user and getattr(user, 'role', None) != 'admin':
                raise serializers.ValidationError({
                    "detail": "Le système est actuellement en cours de maintenance. Seuls les administrateurs peuvent accéder à la plateforme."
                })

        try:
            data = super().validate(attrs)
            # Reset failures on success
            if user:
                user.failed_login_attempts = 0
                user.save()
            return data
        except Exception as e:
            if user:
                user.failed_login_attempts += 1
                user.last_failed_login = timezone.now()
                
                config = None
                if user and user.establishment:
                    config = SchoolConfiguration.all_objects.filter(establishment=user.establishment).first()
                
                if config and user.failed_login_attempts >= config.max_login_attempts:
                    user.is_locked = True
                
                user.save()
            raise e

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

class PasswordResetView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if email:
            # Here we would normally send an email
            print(f"Password reset requested for: {email}")
            return response.Response({"message": "Instructions envoyées par email."}, status=status.HTTP_200_OK)
        return response.Response({"error": "Email requis."}, status=status.HTTP_400_BAD_REQUEST)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @decorators.action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return response.Response({'status': 'all marked as read'})

    @decorators.action(detail=False, methods=['post'], url_path='delete-all')
    def delete_all(self, request):
        self.get_queryset().delete()
        return response.Response({'status': 'all notifications deleted'})

    @decorators.action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return response.Response({'status': 'marked as read'})

from django.conf import settings

class InitAdminView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token = request.GET.get('token')
        if token != settings.MIGRATION_TOKEN:
            return response.Response({"error": "Invalid token"}, status=403)
        
        # Delete existing admin if it exists to allow reset
        User.objects.filter(username='admin').delete()

        user = User.objects.create_superuser(
            username='admin',
            email='hackdumping@gmail.com',
            password='@Dumping0305',
            role='admin'
        )
        return response.Response({
            "message": "Old admin deleted and new admin created successfully",
            "username": "admin",
            "password": "@Dumping0305",
            "email": "hackdumping@gmail.com"
        })
