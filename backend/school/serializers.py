from rest_framework import serializers
from django.db import models
from .models import SchoolYear, Class, Student, Subject, Period, Grade, SchoolConfiguration

class SchoolYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolYear
        fields = '__all__'

class ClassSerializer(serializers.ModelSerializer):
    currentSize = serializers.IntegerField(source='current_size', read_only=True)
    categoryDisplay = serializers.CharField(source='get_category_display', read_only=True)
    isExam = serializers.BooleanField(source='is_exam')
    maxSize = serializers.IntegerField(source='max_size')
    schoolYear = serializers.PrimaryKeyRelatedField(source='school_year', queryset=SchoolYear.objects.all())
    tuitionTemplate = serializers.PrimaryKeyRelatedField(source='tuition_template', queryset=Class.objects.model.tuition_template.field.related_model.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Class
        fields = ('id', 'name', 'level', 'category', 'categoryDisplay', 'tuitionTemplate', 'isExam', 'maxSize', 'schoolYear', 'currentSize')

class StudentSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    dateOfBirth = serializers.DateField(source='date_of_birth')
    placeOfBirth = serializers.CharField(source='place_of_birth', required=False, allow_null=True, allow_blank=True)
    isRepeating = serializers.BooleanField(source='is_repeating', required=False)
    parentName = serializers.CharField(source='parent_name')
    parentPhone = serializers.CharField(source='parent_phone')
    parentEmail = serializers.EmailField(source='parent_email', required=False, allow_null=True)
    classId = serializers.PrimaryKeyRelatedField(source='school_class', queryset=Class.objects.all())
    enrollmentDate = serializers.DateField(source='enrollment_date', read_only=True)
    className = serializers.CharField(source='school_class.name', read_only=True)
    paymentStatus = serializers.SerializerMethodField()
    totalPaid = serializers.SerializerMethodField()
    totalDue = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ('id', 'firstName', 'lastName', 'matricule', 'dateOfBirth', 'placeOfBirth', 'isRepeating', 'gender', 'address', 'parentName', 'parentPhone', 'parentEmail', 'classId', 'enrollmentDate', 'status', 'className', 'paymentStatus', 'totalPaid', 'totalDue')

    def get_totalPaid(self, obj):
        return obj.payments.aggregate(models.Sum('amount_paid'))['amount_paid__sum'] or 0

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
    schoolYear = serializers.PrimaryKeyRelatedField(source='school_year', queryset=SchoolYear.objects.all())
    
    class Meta:
        model = Period
        fields = ('id', 'name', 'startDate', 'endDate', 'schoolYear')

class GradeSerializer(serializers.ModelSerializer):
    studentId = serializers.PrimaryKeyRelatedField(source='student', queryset=Student.objects.all())
    subjectId = serializers.PrimaryKeyRelatedField(source='subject', queryset=Subject.objects.all())
    periodId = serializers.PrimaryKeyRelatedField(source='period', queryset=Period.objects.all())
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
    class Meta:
        model = SchoolConfiguration
        fields = '__all__'
