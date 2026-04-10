from rest_framework import serializers
from django.db import models
from django.db.models import Q
from .models import TrancheConfig, Payment, Expense, TuitionTemplate
from school.models import Student, Class

class TuitionTemplateSerializer(serializers.ModelSerializer):
    registrationFee = serializers.DecimalField(source='registration_fee', max_digits=12, decimal_places=2)
    tranche1 = serializers.DecimalField(source='tranche_1', max_digits=12, decimal_places=2)
    tranche2 = serializers.DecimalField(source='tranche_2', max_digits=12, decimal_places=2)
    tranche3 = serializers.DecimalField(source='tranche_3', max_digits=12, decimal_places=2)
    materialFee = serializers.DecimalField(source='material_fee', max_digits=12, decimal_places=2)
    categoryDisplay = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = TuitionTemplate
        fields = ('id', 'name', 'category', 'categoryDisplay', 'registrationFee', 'tranche1', 'tranche2', 'tranche3', 'materialFee')

class TrancheConfigSerializer(serializers.ModelSerializer):
    dueDate = serializers.DateField(source='due_date')
    schoolClass = serializers.PrimaryKeyRelatedField(source='school_class', queryset=Class.objects.all())
    
    class Meta:
        model = TrancheConfig
        fields = ('id', 'schoolClass', 'name', 'amount', 'dueDate')

class PaymentSerializer(serializers.ModelSerializer):
    studentId = serializers.PrimaryKeyRelatedField(source='student', queryset=Student.objects.all())
    trancheId = serializers.PrimaryKeyRelatedField(source='tranche', queryset=TrancheConfig.objects.all())
    amountPaid = serializers.DecimalField(source='amount_paid', max_digits=12, decimal_places=2)
    amountExpected = serializers.DecimalField(source='amount_expected', max_digits=12, decimal_places=2)
    receiptNumber = serializers.CharField(source='receipt_number')
    recordedBy = serializers.CharField(source='recorded_by.username', read_only=True)
    
    studentName = serializers.SerializerMethodField()
    className = serializers.CharField(source='student.school_class.name', read_only=True)
    trancheName = serializers.CharField(source='tranche.name', read_only=True)
    remainingBalance = serializers.SerializerMethodField()

    def get_studentName(self, obj):
        return f"{obj.student.last_name.upper()} {obj.student.first_name}"
    
    def get_remainingBalance(self, obj):
        # Calculate balance after this specific payment
        # Filter payments for same student/tranche up to this point
        total_paid_so_far = Payment.objects.filter(
            student=obj.student,
            tranche=obj.tranche
        ).filter(
            Q(date__lt=obj.date) | Q(date=obj.date, id__lte=obj.id)
        ).aggregate(models.Sum('amount_paid'))['amount_paid__sum'] or 0
        
        return max(0, float(obj.amount_expected) - float(total_paid_so_far))
    
    class Meta:
        model = Payment
        fields = ('id', 'studentId', 'trancheId', 'amountPaid', 'amountExpected', 'remainingBalance', 'date', 'mode', 'receiptNumber', 'recordedBy', 'notes', 'studentName', 'className', 'trancheName')

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
