from rest_framework import serializers
from django.db import models
from .models import SchoolYear, Class, Student, Subject, Period, Grade, SchoolConfiguration, Teacher, SanctionType, TeacherSanction

class SchoolYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolYear
        fields = '__all__'

class TrancheSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)

class ClassSerializer(serializers.ModelSerializer):
    currentSize = serializers.IntegerField(source='current_size', read_only=True)
    categoryDisplay = serializers.CharField(source='get_category_display', read_only=True)
    isExam = serializers.BooleanField(source='is_exam')
    maxSize = serializers.IntegerField(source='max_size')
    schoolYear = serializers.PrimaryKeyRelatedField(source='school_year', queryset=SchoolYear.all_objects.all(), required=False, allow_null=True)
    tuitionTemplate = serializers.PrimaryKeyRelatedField(source='tuition_template', queryset=Class.all_objects.model.tuition_template.field.related_model.all_objects.all(), required=False, allow_null=True)
    tranches = TrancheSerializer(many=True, read_only=True)

    class Meta:
        model = Class
        fields = ('id', 'name', 'level', 'category', 'categoryDisplay', 'tuitionTemplate', 'isExam', 'maxSize', 'schoolYear', 'currentSize', 'tranches')

class StudentSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    dateOfBirth = serializers.DateField(source='date_of_birth')
    placeOfBirth = serializers.CharField(source='place_of_birth', required=False, allow_null=True, allow_blank=True)
    isRepeating = serializers.BooleanField(source='is_repeating', required=False)
    parentName = serializers.CharField(source='parent_name')
    parentPhone = serializers.CharField(source='parent_phone')
    parentEmail = serializers.EmailField(source='parent_email', required=False, allow_null=True)
    classId = serializers.PrimaryKeyRelatedField(source='school_class', queryset=Class.all_objects.all())
    enrollmentDate = serializers.DateField(source='enrollment_date', read_only=True)
    className = serializers.CharField(source='school_class.name', read_only=True)
    paymentStatus = serializers.SerializerMethodField()
    totalPaid = serializers.SerializerMethodField()
    totalDue = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ('id', 'firstName', 'lastName', 'matricule', 'dateOfBirth', 'placeOfBirth', 'isRepeating', 'gender', 'address', 'parentName', 'parentPhone', 'parentEmail', 'classId', 'enrollmentDate', 'status', 'className', 'paymentStatus', 'totalPaid', 'totalDue')

    def get_totalPaid(self, obj):
        return obj.total_paid

    def get_totalDue(self, obj):
        return obj.total_due

    def get_paymentStatus(self, obj):
        total_due = self.get_totalDue(obj)
        if total_due == 0:
            return 'paid'
        
        total_paid = self.get_totalPaid(obj)
        
        if total_paid >= total_due:
            return 'paid'
        if total_paid > 0:
            return 'partial'
        return 'unpaid'

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

class PeriodSerializer(serializers.ModelSerializer):
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date')
    schoolYear = serializers.PrimaryKeyRelatedField(source='school_year', queryset=SchoolYear.all_objects.all())
    
    class Meta:
        model = Period
        fields = ('id', 'name', 'startDate', 'endDate', 'schoolYear')

class GradeSerializer(serializers.ModelSerializer):
    studentId = serializers.PrimaryKeyRelatedField(source='student', queryset=Student.all_objects.all())
    subjectId = serializers.PrimaryKeyRelatedField(source='subject', queryset=Subject.all_objects.all())
    periodId = serializers.PrimaryKeyRelatedField(source='period', queryset=Period.all_objects.all())
    maxValue = serializers.DecimalField(source='max_value', max_digits=5, decimal_places=2)
    teacherId = serializers.PrimaryKeyRelatedField(source='teacher', read_only=True)
    
    studentName = serializers.SerializerMethodField()
    subjectName = serializers.CharField(source='subject.name', read_only=True)
    periodName = serializers.CharField(source='period.name', read_only=True)
    
    def get_studentName(self, obj):
        return f"{obj.student.last_name.upper()} {obj.student.first_name}"
    
    class Meta:
        model = Grade
        fields = ('id', 'studentId', 'subjectId', 'periodId', 'value', 'maxValue', 'date', 'teacherId', 'studentName', 'subjectName', 'periodName')

class SchoolConfigurationSerializer(serializers.ModelSerializer):
    selected_types = serializers.ListField(child=serializers.CharField(), source='establishment.selected_types', required=False)
    establishment_name = serializers.CharField(source='establishment.name', required=False)
    owner_id = serializers.IntegerField(source='establishment.owner_id', read_only=True)

    class Meta:
        model = SchoolConfiguration
        fields = '__all__'

    def update(self, instance, validated_data):
        # Extract establishment data if present (can be nested or flat depending on parser)
        establishment_data = validated_data.pop('establishment', {})
        new_types = establishment_data.get('selected_types') or validated_data.get('selected_types')
        establishment_name = establishment_data.get('name') or validated_data.get('name') or validated_data.get('establishment_name')
        
        old_types = instance.establishment.selected_types or []

        if new_types is not None:
            # Detect new cycles being added
            tech_added = 'technique' in new_types and 'technique' not in old_types
            general_added = 'general' in new_types and 'general' not in old_types
            
            instance.establishment.selected_types = new_types
            instance.establishment.save()

            if tech_added or general_added:
                from .models import SchoolYear, Class
                active_year = SchoolYear.objects.filter(is_active=True).first()
                if active_year:
                    if tech_added:
                        tech_levels = ["1ère Année", "2ème Année", "3ème Année", "4ème Année", "2nde", "1ère", "Tle"]
                        for level in tech_levels:
                            Class.objects.get_or_create(
                                level=level,
                                school_year=active_year,
                                establishment=instance.establishment,
                                defaults={'name': level, 'category': 'technique'}
                            )
                    
                    if general_added:
                        gen_levels = ["6ème", "5ème", "4ème", "3ème", "2nde A", "2nde C", "1ère A", "1ère C", "1ère D", "Tle A", "Tle C", "Tle D"]
                        for level in gen_levels:
                            Class.objects.get_or_create(
                                level=level,
                                school_year=active_year,
                                establishment=instance.establishment,
                                defaults={'name': level, 'category': 'general'}
                            )
        
        if establishment_name is not None:
            instance.establishment.name = establishment_name
            instance.establishment.save()

        return super().update(instance, validated_data)

class SanctionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SanctionType
        fields = ('id', 'name', 'default_amount')

class TeacherSanctionSerializer(serializers.ModelSerializer):
    sanctionTypeName = serializers.CharField(source='sanction_type.name', read_only=True)
    teacher = serializers.PrimaryKeyRelatedField(queryset=Teacher.all_objects.all())
    sanction_type = serializers.PrimaryKeyRelatedField(queryset=SanctionType.all_objects.all())
    
    class Meta:
        model = TeacherSanction
        fields = ('id', 'teacher', 'sanction_type', 'amount', 'date', 'reason', 'sanctionTypeName')

class TeacherSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    baseSalary = serializers.DecimalField(source='base_salary', max_digits=12, decimal_places=2)
    dateJoined = serializers.DateField(source='date_joined', read_only=True)
    amountToPay = serializers.SerializerMethodField()
    sanctionsCount = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = ('id', 'firstName', 'lastName', 'email', 'phone', 'matricule', 'baseSalary', 'amountToPay', 'sanctionsCount', 'dateJoined', 'is_active')
        read_only_fields = ('matricule',)

    def get_amountToPay(self, obj):
        from django.utils import timezone
        import datetime
        from decimal import Decimal
        import calendar
        
        now = timezone.now()
        ctx_month = self.context.get('month')
        ctx_year = self.context.get('year')
        
        try:
            month = int(ctx_month) if ctx_month else now.month
            year = int(ctx_year) if ctx_year else now.year
        except (ValueError, TypeError):
            month = now.month
            year = now.year
        
        # Robust date range filtering
        _, last_day = calendar.monthrange(year, month)
        start_date = datetime.date(year, month, 1)
        end_date = datetime.date(year, month, last_day)
        
        try:
            salary = Decimal(str(obj.base_salary or 0))
            
            # Use is_processed=False to only deduct pending sanctions
            sanctions = obj.sanctions.filter(
                date__range=(start_date, end_date),
                is_processed=False
            )
            sanctions_sum = sum([s.amount for s in sanctions]) or Decimal('0')
            sanctions_sum = Decimal(str(sanctions_sum))
            
            return float(salary - sanctions_sum)
        except Exception:
            return float(obj.base_salary or 0)

    def get_sanctionsCount(self, obj):
        from django.utils import timezone
        import datetime
        import calendar
        
        now = timezone.now()
        ctx_month = self.context.get('month')
        ctx_year = self.context.get('year')
        
        try:
            month = int(ctx_month) if ctx_month else now.month
            year = int(ctx_year) if ctx_year else now.year
        except (ValueError, TypeError):
            month = now.month
            year = now.year
        
        try:
            _, last_day = calendar.monthrange(year, month)
            start_date = datetime.date(year, month, 1)
            end_date = datetime.date(year, month, last_day)
            
            # Simple count of pending sanctions
            return obj.sanctions.filter(
                date__range=(start_date, end_date),
                is_processed=False
            ).count()
        except Exception:
            return 0
