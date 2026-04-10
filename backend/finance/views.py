from rest_framework import viewsets, permissions, response, decorators
from .models import TrancheConfig, Payment, Expense, TuitionTemplate
from .serializers import TrancheConfigSerializer, PaymentSerializer, ExpenseSerializer, TuitionTemplateSerializer
from school.models import Student, Class
from django.db.models import Sum

class TrancheConfigViewSet(viewsets.ModelViewSet):
    queryset = TrancheConfig.objects.all()
    serializer_class = TrancheConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

class TuitionTemplateViewSet(viewsets.ModelViewSet):
    queryset = TuitionTemplate.objects.all()
    serializer_class = TuitionTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

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
        last_payment = Payment.objects.order_by('-id').first()
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

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
