from rest_framework import viewsets, permissions, response, decorators
from .models import TrancheConfig, Payment, Expense, TuitionTemplate
from .serializers import TrancheConfigSerializer, PaymentSerializer, ExpenseSerializer, TuitionTemplateSerializer
from tenants.mixins import TenantScopedViewSetMixin
from school.models import Student, Class
from django.db.models import Sum

class TrancheConfigViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = TrancheConfig.objects.all()
    serializer_class = TrancheConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

class TuitionTemplateViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = TuitionTemplate.objects.all()
    serializer_class = TuitionTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

class PaymentViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from django.db.models import F
        # Only show payments for the student's current class
        # This automatically hides old payments after promotion
        return Payment.objects.filter(
            tranche__school_class=F('student__school_class')
        ).order_by('-id')

    @decorators.action(detail=False, methods=['get'])
    def summary(self, request):
        student_id = request.query_params.get('student_id')
        if not student_id:
            return response.Response({'error': 'student_id is required'}, status=400)
        
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return response.Response({'error': 'Student not found'}, status=404)

        tranches = student.school_class.tranches.all()
        student_payments = student.payments.all()
        
        summary_data = []
        total_expected = 0
        total_paid = 0
        
        for tranche in tranches:
            paid = student_payments.filter(tranche=tranche).aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0
            expected = tranche.amount
            total_expected += expected
            total_paid += paid
            
            status = 'unpaid'
            if paid >= expected: status = 'paid'
            elif paid > 0: status = 'partial'
            
            summary_data.append({
                'tranche_id': tranche.id,
                'tranche_name': tranche.name,
                'expected': expected,
                'paid': paid,
                'remaining': expected - paid,
                'status': status,
                'due_date': tranche.due_date,
            })
            
        return response.Response({
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}",
            'class_name': student.school_class.name,
            'tranches': summary_data,
            'total_expected': total_expected,
            'total_paid': total_paid,
            'total_remaining': total_expected - total_paid,
        })

    @decorators.action(detail=False, methods=['get'], url_path='next-receipt')
    def next_receipt_number(self, request):
        import re
        # Explicitly filter by establishment to double-ensure isolation
        last_payment = Payment.objects.filter(establishment=request.user.establishment).order_by('-id').first()
        if not last_payment:
            return response.Response({'next_number': 'REC-001'})
        
        last_number = last_payment.receipt_number
        # Try to find a numeric part at the end
        match = re.search(r'(\d+)$', last_number)
        if match:
            number_str = match.group(1)
            next_num = int(number_str) + 1
            # Maintain padding
            padding = len(number_str)
            next_number = last_number[:match.start()] + str(next_num).zfill(padding)
        else:
            # Fallback if no numeric part
            next_number = f"{last_number}-1"
            
        return response.Response({'next_number': next_number})

class ExpenseViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

class TeacherPaymentViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    from .models import TeacherPayment
    from .serializers import TeacherPaymentSerializer
    queryset = TeacherPayment.objects.all()
    serializer_class = TeacherPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        payment = serializer.save()
        
        # 1. Automatic Expense Creation
        # Create a corresponding expense entry for the accounting module
        from .models import Expense
        from django.utils import timezone
        
        Expense.objects.create(
            description=f"Salaire : {payment.teacher.last_name.upper()} {payment.teacher.first_name} ({payment.month}/{payment.year})",
            amount=payment.amount_paid,
            date=timezone.now().date(),
            category="Salaires",
            recorded_by=payment.recorded_by or self.request.user,
            establishment=payment.establishment
        )
        
        # 2. Mark sanctions as processed
        # When a payment is recorded, we mark all current sanctions for this month/year as processed
        # so they "disappear" from the pending list and net pay calculation.
        from school.models import TeacherSanction
        TeacherSanction.objects.filter(
            teacher=payment.teacher,
            date__month=payment.month,
            date__year=payment.year,
            is_processed=False
        ).update(is_processed=True)

    def get_queryset(self):
        qs = super().get_queryset()
        teacher_id = self.request.query_params.get('teacher_id')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        if month:
            qs = qs.filter(month=month)
        if year:
            qs = qs.filter(year=year)
            
        return qs
