from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import SchoolYear, Class, Student, Subject, Period, Grade, SchoolConfiguration
from .serializers import SchoolYearSerializer, ClassSerializer, StudentSerializer, SubjectSerializer, PeriodSerializer, GradeSerializer, SchoolConfigurationSerializer
from tenants.mixins import TenantScopedViewSetMixin

class SchoolYearViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = SchoolYear.objects.all()
    serializer_class = SchoolYearSerializer
    permission_classes = [permissions.IsAuthenticated]

class ClassViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter classes by current active year by default
        return Class.objects.filter(school_year__is_active=True).order_by('level', 'name')

    def perform_create(self, serializer):
        from tenants.models import get_current_tenant
        from finance.models import TuitionTemplate
        tenant = get_current_tenant()
        school_year = serializer.validated_data.get('school_year')
        
        if tenant and school_year and school_year.establishment != tenant:
            from rest_framework import serializers
            raise serializers.ValidationError({"schoolYear": "Cette année scolaire n'appartient pas à votre établissement."})
        
        # Automatic TuitionTemplate creation if missing
        tuition_template = serializer.validated_data.get('tuition_template')
        if not tuition_template:
            level = serializer.validated_data.get('level')
            category = serializer.validated_data.get('category', 'general')
            
            # Check for existing template for this level/category to avoid duplicates
            # or create a new one with zero values
            tuition_template, created = TuitionTemplate.objects.get_or_create(
                name=level,
                category=category,
                establishment=tenant,
                defaults={
                    'registration_fee': 0,
                    'tranche_1': 0,
                    'tranche_2': 0,
                    'tranche_3': 0,
                    'material_fee': 0
                }
            )
            serializer.validated_data['tuition_template'] = tuition_template
            
        serializer.save(establishment=tenant)

    def perform_update(self, serializer):
        from tenants.models import get_current_tenant
        tenant = get_current_tenant()
        school_year = serializer.validated_data.get('school_year')
        if tenant and school_year and school_year.establishment != tenant:
            from rest_framework import serializers
            raise serializers.ValidationError({"schoolYear": "Cette année scolaire n'appartient pas à votre établissement."})
        serializer.save()

class StudentViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter students by current active year classes
        return Student.objects.filter(school_class__school_year__is_active=True).order_by('last_name', 'first_name')

    def perform_create(self, serializer):
        from tenants.models import get_current_tenant
        tenant = get_current_tenant()
        school_class = serializer.validated_data.get('school_class')
        if tenant and school_class and school_class.establishment != tenant:
            from rest_framework import serializers
            raise serializers.ValidationError({"classId": "Cette classe n'appartient pas à votre établissement."})
        serializer.save(establishment=tenant)

    def perform_update(self, serializer):
        from tenants.models import get_current_tenant
        tenant = get_current_tenant()
        school_class = serializer.validated_data.get('school_class')
        if tenant and school_class and school_class.establishment != tenant:
            from rest_framework import serializers
            raise serializers.ValidationError({"classId": "Cette classe n'appartient pas à votre établissement."})
        serializer.save()

    @action(detail=False, methods=['post'], url_path='import')
    def bulk_import(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Aucun fichier n\'a été envoyé'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            import pandas as pd
            import io
            import uuid
            from datetime import datetime
            from decimal import Decimal
        except ImportError:
            return Response({'error': 'Bibliothèques de traitement de données non installées. Contactez le support.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        try:
            if file.name.endswith('.csv'):
                df = pd.read_csv(io.StringIO(file.read().decode('utf-8')))
            else:
                df = pd.read_excel(file)
            
            # Map French column names to student fields
            column_map = {
                'nom': 'last_name',
                'prenom': 'first_name',
                'prénom': 'first_name',
                'sexe': 'gender',
                'genre': 'gender',
                'date_naissance': 'date_of_birth',
                'date de naissance': 'date_of_birth',
                'lieu_naissance': 'place_of_birth',
                'lieu de naissance': 'place_of_birth',
                'adresse': 'address',
                'parent_nom': 'parent_name',
                'nom du parent': 'parent_name',
                'parent_tel': 'parent_phone',
                'telephone parent': 'parent_phone',
                'téléphone parent': 'parent_phone',
                'classe': 'school_class'
            }
            
            # Normalize column names for comparison
            raw_columns = df.columns.tolist()
            normalized_df = df.copy()
            
            # Attempt to rename columns based on map
            rename_dict = {}
            for col in raw_columns:
                norm = col.lower().strip()
                if norm in column_map:
                    rename_dict[col] = column_map[norm]
            
            normalized_df = normalized_df.rename(columns=rename_dict)
            
            # Required fields check
            required = ['last_name', 'first_name', 'gender', 'date_of_birth', 'school_class']
            missing = [f for f in required if f not in normalized_df.columns]
            if missing:
                return Response({'error': f'Colonnes obligatoires manquantes : {", ".join(missing)}'}, status=status.HTTP_400_BAD_REQUEST)
            
            created_count = 0
            errors = []
            
            from tenants.models import get_current_tenant
            tenant = get_current_tenant()
            if not tenant:
                 return Response({'error': 'Contexte établissement non trouvé'}, status=status.HTTP_401_UNAUTHORIZED)

            for index, row in normalized_df.iterrows():
                try:
                    # Resolve class
                    class_name = str(row['school_class']).strip()
                    school_class = Class.objects.filter(name__iexact=class_name, establishment=tenant).first()
                    if not school_class:
                        errors.append(f"Ligne {index+2}: La classe '{class_name}' n'existe pas.")
                        continue
                    
                    # Generate matricule if not present
                    matricule = row.get('matricule')
                    if pd.isna(matricule) or not str(matricule).strip():
                        year = datetime.now().year
                        # Format: MAT-YYYY-XXX
                        count = Student.objects.filter(matricule__startswith=f'MAT-{year}', establishment=tenant).count()
                        matricule = f'MAT-{year}-{(count + 1 + index):03d}'
                    
                    # Gender normalization
                    g = str(row['gender']).strip().upper()[0] if not pd.isna(row['gender']) else 'M'
                    if g not in ['M', 'F']: g = 'M'

                    # Handle date_of_birth (attempt to convert if not already date)
                    dob = row['date_of_birth']
                    if isinstance(dob, str):
                        try:
                            dob = datetime.strptime(dob, '%Y-%m-%d').date()
                        except ValueError:
                            try:
                                dob = datetime.strptime(dob, '%d/%m/%Y').date()
                            except ValueError:
                                errors.append(f"Ligne {index+2}: Format de date invalide pour '{row['first_name']}'. Utilisez AAAA-MM-JJ ou JJ/MM/AAAA.")
                                continue

                    Student.objects.create(
                        first_name=str(row['first_name']).strip(),
                        last_name=str(row['last_name']).strip(),
                        matricule=str(matricule).strip(),
                        date_of_birth=dob,
                        place_of_birth=str(row.get('place_of_birth', '')).strip() if not pd.isna(row.get('place_of_birth')) else '',
                        gender=g,
                        address=str(row.get('address', '')).strip() if not pd.isna(row.get('address')) else '',
                        parent_name=str(row.get('parent_name', '')).strip() if not pd.isna(row.get('parent_name')) else '',
                        parent_phone=str(row.get('parent_phone', '')).strip() if not pd.isna(row.get('parent_phone')) else '',
                        school_class=school_class,
                        establishment=tenant
                    )
                    created_count += 1
                except Exception as e:
                    errors.append(f"Ligne {index+2}: {str(e)}")
            
            return Response({
                'message': f'Succès: {created_count} élèves importés.',
                'errors': errors
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': f"Erreur lors de la lecture du fichier: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='bulk-promote')
    def bulk_promote(self, request):
        promotions = request.data
        if not isinstance(promotions, list):
            return Response({'error': 'Expected a list of promotions'}, status=status.HTTP_400_BAD_REQUEST)
        
        results = []
        for item in promotions:
            student_id = item.get('studentId')
            class_id = item.get('classId')
            is_repeating = item.get('isRepeating', False)
            status_val = item.get('status', 'active')
            
            if student_id and class_id:
                try:
                    student = Student.objects.get(id=student_id)
                    student.school_class_id = class_id
                    student.is_repeating = is_repeating
                    student.status = status_val
                    student.save()
                    results.append(StudentSerializer(student).data)
                except Student.DoesNotExist:
                    continue
        
        return Response(results, status=status.HTTP_200_OK)

class SubjectViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

class PeriodViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Period.objects.all()
    serializer_class = PeriodSerializer
    permission_classes = [permissions.IsAuthenticated]

class GradeViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        grades_data = request.data
        if not isinstance(grades_data, list):
            return Response({'error': 'Expected a list of grades'}, status=status.HTTP_400_BAD_REQUEST)
        
        results = []
        for item in grades_data:
            student_id = item.get('student')
            subject_id = item.get('subject')
            period_id = item.get('period')
            value = item.get('value')
            
            if student_id and subject_id and period_id:
                grade, created = Grade.objects.update_or_create(
                    student_id=student_id,
                    subject_id=subject_id,
                    period_id=period_id,
                    defaults={'value': value}
                )
                results.append(GradeSerializer(grade).data)
        
        return Response(results, status=status.HTTP_201_CREATED)

class SchoolConfigurationViewSet(viewsets.ViewSet):
    from rest_framework.parsers import MultiPartParser, JSONParser, FormParser
    parser_classes = [MultiPartParser, JSONParser, FormParser]

    def get_permissions(self):
        if self.action == 'school_settings' and self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get', 'patch'], url_path='settings')
    def school_settings(self, request):
        from tenants.models import get_current_tenant, Establishment
        from django.utils.cache import patch_vary_headers
        tenant = get_current_tenant()
        
        # Determine target establishment with strict priority
        tenant_id_header = request.headers.get('X-Tenant-ID')
        is_super = request.user.is_authenticated and (request.user.is_superuser or request.user.username == 'admin')

        if is_super and tenant_id_header:
            # Impersonation mode
            target_est = tenant
        elif not is_super and hasattr(request.user, 'establishment') and request.user.establishment:
            # Regular user mode: strictly their own school
            target_est = request.user.establishment
        else:
            # Fallback to whatever the middleware resolved (e.g. via slug if implemented later)
            target_est = tenant

        if not target_est:
            return Response({"error": "Aucun établissement identifié."}, status=status.HTTP_400_BAD_REQUEST)

        obj, created = SchoolConfiguration.all_objects.get_or_create(establishment=target_est)
        
        if request.method == 'PATCH':
            serializer = SchoolConfigurationSerializer(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                response = Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            serializer = SchoolConfigurationSerializer(obj)
            response = Response(serializer.data)

        # SECURITY: Prevent browser caching to avoid data leak when switching schools
        patch_vary_headers(response, ['X-Tenant-ID', 'Authorization'])
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response

class TeacherViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    from .models import Teacher
    from .serializers import TeacherSerializer
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({
            "month": self.request.query_params.get('month'),
            "year": self.request.query_params.get('year')
        })
        return context

class SanctionTypeViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    from .models import SanctionType
    from .serializers import SanctionTypeSerializer
    queryset = SanctionType.objects.all()
    serializer_class = SanctionTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class TeacherSanctionViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    from .models import TeacherSanction
    from .serializers import TeacherSanctionSerializer
    queryset = TeacherSanction.objects.all()
    serializer_class = TeacherSanctionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        teacher_id = self.request.query_params.get('teacher_id')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if month:
            qs = qs.filter(date__month=month)
        if year:
            qs = qs.filter(date__year=year)
            
        # By default, we only show PENDING (unprocessed) sanctions in the list
        # This gives the "disappearing" effect after payment.
        qs = qs.filter(is_processed=False)
            
        return qs
