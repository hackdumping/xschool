from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from school.models import Student, Class, SchoolConfiguration
from finance.models import Payment, Expense, TrancheConfig
from agenda.models import CalendarEvent
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import timedelta

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        total_students = Student.objects.filter(status='active').count()
        total_classes = Class.objects.count()
        
        payments = Payment.objects.all()
        expenses = Expense.objects.all()
        
        totals = payments.aggregate(
            income=Sum('amount_paid'),
            expected=Sum('amount_expected')
        )
        total_income = float(totals['income'] or 0)
        total_expected = float(totals['expected'] or 0)
        total_expenses = float(expenses.aggregate(Sum('amount'))['amount__sum'] or 0)
        
        # Gender distribution
        gender_stats = Student.objects.filter(status='active').values('gender').annotate(count=Count('id'))
        boys = next((x['count'] for x in gender_stats if x['gender'] == 'M'), 0)
        girls = next((x['count'] for x in gender_stats if x['gender'] == 'F'), 0)
        
        # Recent operations
        recent_payments = payments.select_related('student').order_by('-date')[:5]
        recent_expenses = expenses.order_by('-date')[:5]
        
        ops = []
        for p in recent_payments:
            ops.append({
                'id': f'p-{p.id}',
                'type': 'payment',
                'description': f'Paiement de {p.student.last_name.upper()} {p.student.first_name}',
                'date': p.date,
                'amount': float(p.amount_paid)
            })
        for e in recent_expenses:
            ops.append({
                'id': f'e-{e.id}',
                'type': 'expense',
                'description': e.description,
                'date': e.date,
                'amount': float(e.amount)
            })
        
        ops.sort(key=lambda x: x['date'], reverse=True)
        recovery_rate = (total_income / total_expected * 100) if total_expected > 0 else 0

        # Pending payments calculation (Simplified for performance)
        # In a real app, this should be a dedicated aggregate or cached
        pending_count = 0
        active_students = Student.objects.filter(status='active').select_related('school_class__tuition_template')
        for s in active_students[:100]: # Limit for dashboard performance
            if float(s.total_paid) < float(s.total_due):
                pending_count += 1

        # Real Alerts Generation
        alerts = []
        
        # 1. Delays check (sample of students for performance)
        overdue_count = 0
        for s in active_students[:50]:
            if float(s.total_paid) < float(s.total_due):
                # check if any tranche due date for this student's class has passed
                has_overdue = s.school_class.tranches.filter(due_date__lt=today).exists()
                if has_overdue:
                    overdue_count += 1

        if overdue_count > 0:
            alerts.append({
                'id': 'alert-overdue',
                'severity': 'high',
                'title': 'Retards de paiement',
                'description': f'Certains élèves ont des tranches impayées en retard.',
                'date': today
            })

        # 2. Upcoming events
        upcoming_events = CalendarEvent.objects.filter(start_date__date__range=[today, today + timedelta(days=7)])[:3]
        for event in upcoming_events:
            alerts.append({
                'id': f'alert-event-{event.id}',
                'severity': 'medium',
                'title': 'Événement proche',
                'description': f'"{event.title}" le {event.start_date.strftime("%d/%m")}.',
                'date': event.start_date.date()
            })

        # 3. New enrollments
        new_enrollments = Student.objects.filter(enrollment_date__gte=today - timedelta(days=2)).count()
        if new_enrollments > 0:
            alerts.append({
                'id': 'alert-new-students',
                'severity': 'info',
                'title': 'Nouvelles inscriptions',
                'description': f'{new_enrollments} nouveaux élèves cette semaine.',
                'date': today
            })

        # Class summaries
        class_summaries = []
        for cls in Class.objects.prefetch_related('students', 'students__payments', 'tranches'):
            cls_expected = 0
            cls_paid = 0
            student_count = 0
            
            for s in cls.students.all():
                if s.status == 'active':
                    student_count += 1
                    cls_expected += float(s.total_due)
                    cls_paid += float(s.total_paid)
            
            summary = {
                'classId': cls.id,
                'className': cls.name,
                'studentCount': student_count,
                'totalExpected': cls_expected,
                'totalPaid': cls_paid,
                'totalRemaining': max(0, cls_expected - cls_paid),
                'recoveryRate': (cls_paid / cls_expected * 100) if cls_expected > 0 else 0
            }
            class_summaries.append(summary)

        return Response({
            'totalStudents': total_students,
            'totalClasses': total_classes,
            'globalRecoveryRate': round(recovery_rate, 1),
            'generalBalance': float(total_income - total_expenses),
            'totalIncome': total_income,
            'totalExpenses': total_expenses,
            'activeAlerts': len(alerts),
            'pendingPayments': pending_count,
            'genderStats': {
                'boys': boys,
                'girls': girls
            },
            'recentOperations': ops[:5],
            'alerts': alerts,
            'classSummaries': class_summaries
        })
