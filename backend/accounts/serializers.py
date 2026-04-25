from rest_framework import serializers
from .models import User, Notification
from school.models import SchoolConfiguration
from tenants.models import Establishment
from tenants.serializers import EstablishmentSerializer
from django.db import transaction
import re

class UserSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)
    establishment_info = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'firstName', 'lastName', 'role', 'avatar', 'establishment', 'establishment_info')
        read_only_fields = ('id', 'establishment_info')

    def get_establishment_info(self, obj):
        from tenants.models import get_current_tenant
        # If impersonating (tenant set), show THAT establishment's info for SuperAdmins
        if obj.is_superuser or obj.username == 'admin':
            tenant = get_current_tenant()
            if tenant:
                return EstablishmentSerializer(tenant).data
        
        # Fallback to user's native establishment
        if obj.establishment:
            return EstablishmentSerializer(obj.establishment).data
        return None

class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    establishment_name = serializers.CharField(write_only=True)
    establishment_types = serializers.ListField(child=serializers.CharField(), write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'establishment_name', 'establishment_types')

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        
        # Security Policy Enforcement
        config = SchoolConfiguration.objects.first()
        if config:
            password = data['password']
            
            # 1. Min Length
            if len(password) < config.min_password_length:
                raise serializers.ValidationError(f"Le mot de passe doit contenir au moins {config.min_password_length} caractères.")
            
            # 2. Complexity (if required)
            if config.require_strong_password:
                if not re.search(r'[A-Z]', password):
                    raise serializers.ValidationError("Le mot de passe doit contenir au moins une lettre majuscule.")
                if not re.search(r'[0-9]', password):
                    raise serializers.ValidationError("Le mot de passe doit contenir au moins un chiffre.")
                if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
                    raise serializers.ValidationError("Le mot de passe doit contenir au moins un caractère spécial.")
        
        return data

    def create(self, validated_data):
        password_confirm = validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        establishment_name = validated_data.pop('establishment_name')
        establishment_types = validated_data.pop('establishment_types')

        with transaction.atomic():
            # 1. Create User first (as we need owner for Establishment)
            # Use all_objects to bypass tenant filtering during creation
            user = User.all_objects.create(role='admin', **validated_data)
            user.set_password(password)
            user.save()

            # 2. Create Establishment (Establishment is NOT a TenantModel, it's the root)
            establishment = Establishment.objects.create(
                name=establishment_name,
                owner=user,
                selected_types=establishment_types
            )

            # 3. Link User back to Establishment
            user.establishment = establishment
            user.save()

            # 4. Create initial school configuration for this tenant
            from school.models import SchoolConfiguration
            SchoolConfiguration.all_objects.create(
                establishment=establishment,
                name=establishment_name,
                email=validated_data.get('email'),
                phone=validated_data.get('phone', '+237 ...'),
                address=validated_data.get('address', 'Yaoundé, Cameroun'),
                city='Yaoundé',
                country='Cameroun',
                english_name=f"{establishment_name} Institution",
                director_title="Le Chef d'Établissement",
                article_text=f"Décret N° 2026/001 du 01 Janvier 2026 portant création et ouverture de l'établissement {establishment_name}."
            )

        return user

class StaffCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'firstName', 'lastName', 'role')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('user', 'created_at')
