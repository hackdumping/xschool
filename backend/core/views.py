from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from rest_framework import permissions
import io
import tempfile
import os
from school.models import Student, Class, SchoolConfiguration
from finance.models import Payment, Expense, TrancheConfig
from agenda.models import CalendarEvent
from accounts.models import Notification
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import timedelta
from django.core.management import call_command
import io

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from tenants.models import get_current_tenant, is_tenant_bypassed
        tenant = get_current_tenant()
        is_impersonating = tenant and not is_tenant_bypassed()
        
        # Base Querysets - Filter by Active School Year
        if is_impersonating:
            classes_qs = Class.all_objects.filter(establishment=tenant, school_year__is_active=True)
            students_qs = Student.all_objects.filter(establishment=tenant, school_class__school_year__is_active=True)
            payments_qs = Payment.all_objects.filter(establishment=tenant, tranche__school_class__school_year__is_active=True)
            expenses_qs = Expense.all_objects.filter(establishment=tenant) # Expenses are usually dated, maybe filter by year?
            events_qs = CalendarEvent.all_objects.filter(establishment=tenant)
        else:
            classes_qs = Class.objects.filter(school_year__is_active=True)
            students_qs = Student.objects.filter(school_class__school_year__is_active=True)
            payments_qs = Payment.objects.filter(tranche__school_class__school_year__is_active=True)
            expenses_qs = Expense.objects.all()
            events_qs = CalendarEvent.objects.all()

        today = timezone.now().date()
        total_students = students_qs.filter(status='active').count()
        total_classes = classes_qs.count()
        
        totals = payments_qs.aggregate(
            income=Sum('amount_paid'),
            expected=Sum('amount_expected')
        )
        total_income = float(totals['income'] or 0)
        total_expected = float(totals['expected'] or 0)
        total_expenses = float(expenses_qs.aggregate(Sum('amount'))['amount__sum'] or 0)
        
        # Gender distribution
        gender_stats = students_qs.filter(status='active').values('gender').annotate(count=Count('id'))
        boys = next((x['count'] for x in gender_stats if x['gender'] == 'M'), 0)
        girls = next((x['count'] for x in gender_stats if x['gender'] == 'F'), 0)
        
        # Recent operations
        recent_payments = payments_qs.select_related('student').order_by('-date')[:5]
        recent_expenses = expenses_qs.order_by('-date')[:5]
        
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

        # Pending payments calculation
        pending_count = 0
        active_students = students_qs.filter(status='active').select_related('school_class__tuition_template')
        for s in active_students[:100]: 
            if float(s.total_paid) < float(s.total_due):
                pending_count += 1

        # Real Alerts Generation
        alerts = []
        overdue_count = 0
        for s in active_students[:50]:
            if float(s.total_paid) < float(s.total_due):
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

        # Upcoming events
        upcoming_events = events_qs.filter(start_date__date__range=[today, today + timedelta(days=7)])[:3]
        for event in upcoming_events:
            alerts.append({
                'id': f'alert-event-{event.id}',
                'severity': 'medium',
                'title': 'Événement proche',
                'description': f'"{event.title}" le {event.start_date.strftime("%d/%m")}.',
                'date': event.start_date.date()
            })

        # New enrollments
        new_enrollments = students_qs.filter(enrollment_date__gte=today - timedelta(days=2)).count()
        if new_enrollments > 0:
            alerts.append({
                'id': 'alert-new-students',
                'severity': 'info',
                'title': 'Nouvelles inscriptions',
                'description': f'{new_enrollments} nouveaux élèves cette semaine.',
                'date': today
            })

        # Class summaries - Optimized and corrected for promotions/partial payments
        class_summaries = []
        total_expected_sum = 0.0
        
        # 1. Fetch system configuration once
        config = SchoolConfiguration.objects.first()
        exam_fee = float(config.exam_fee_amount if (config) else 0)
        
        # 2. Iterate through classes to build summaries
        # Use a more stable prefetch pattern
        for cls in classes_qs:
            # Total Expected Calculation
            active_students_count = cls.students.filter(status='active').count()
            
            cls_expected = 0.0
            if active_students_count > 0:
                cls_exam_fee = exam_fee if cls.is_exam else 0
                if cls.tuition_template:
                    tpl = cls.tuition_template
                    base = float(
                        tpl.registration_fee + tpl.tranche_1 + 
                        tpl.tranche_2 + (tpl.tranche_3 or 0) + tpl.material_fee
                    )
                    cls_expected = active_students_count * (base + cls_exam_fee)
                else:
                    tranche_sum = float(cls.tranches.aggregate(total=Sum('amount'))['total'] or 0)
                    cls_expected = active_students_count * (tranche_sum + cls_exam_fee)
            
            total_expected_sum += cls_expected
            
            # Total Paid: Sum ALL payments made for this class's tranches
            cls_paid = float(Payment.all_objects.filter(
                tranche__school_class=cls
            ).aggregate(total=Sum('amount_paid'))['total'] or 0)
            
            class_summaries.append({
                'classId': cls.id,
                'className': cls.name,
                'studentCount': active_students_count,
                'totalExpected': cls_expected,
                'totalPaid': cls_paid,
                'totalRemaining': max(0.0, cls_expected - cls_paid),
                'recoveryRate': (cls_paid / cls_expected * 100) if cls_expected > 0 else 0.0
            })

        # Recalculate global recovery rate based on corrected total_expected
        total_expected = total_expected_sum
        recovery_rate = (total_income / total_expected * 100) if total_expected > 0 else 0.0
        
        # Total Capacity & Occupancy Rate
        total_capacity = classes_qs.aggregate(total=Sum('max_size'))['total'] or 0
        total_occupancy_rate = (total_students / float(total_capacity) * 100) if total_capacity > 0 else 0
        
        response = Response({
            'totalStudents': total_students,
            'totalClasses': total_classes,
            'totalCapacity': total_capacity,
            'totalOccupancyRate': round(total_occupancy_rate, 1),
            'globalRecoveryRate': round(recovery_rate, 1),
            'generalBalance': float(total_income - total_expenses),
            'totalIncome': total_income,
            'totalExpected': total_expected,
            'totalRemaining': max(0.0, total_expected - total_income),
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

        from django.utils.cache import patch_vary_headers
        patch_vary_headers(response, ['X-Tenant-ID', 'Authorization'])
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response

    def sync_alerts_to_notifications(self, user, alerts):
        """Helper to persist dynamic alerts as notifications"""
        severity_map = {
            'high': 'error',
            'medium': 'warning',
            'low': 'info',
            'info': 'info'
        }
        
        # Threshold to avoid notification spam (last 24h)
        time_threshold = timezone.now() - timedelta(hours=24)
        
        for alert in alerts:
            # Check if matching notification already exists recently
            exists = Notification.objects.filter(
                user=user,
                title=alert['title'],
                created_at__gte=time_threshold
            ).exists()
            
            if not exists:
                Notification.objects.create(
                    user=user,
                    title=alert['title'],
                    message=alert['description'],
                    type=severity_map.get(alert['severity'], 'info')
                )

from django.conf import settings
import traceback

class MigrationView(APIView):
    permission_classes = [] # Public but secured by token

    def get(self, request):
        token = request.GET.get('token')
        if token != settings.MIGRATION_TOKEN:
            return Response({"error": "Invalid token"}, status=403)
        
        out = io.StringIO()
        try:
            call_command('migrate', interactive=False, stdout=out)
            result = out.getvalue()
            return Response({
                "message": "Migrations successful", 
                "output": result
            })
        except Exception as e:
            error_traceback = traceback.format_exc()
            return Response({
                "message": "Migration failed", 
                "error": str(e),
                "traceback": error_traceback
            }, status=500)

    def post(self, request):
        # Keep post as backup for staff
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=403)
        
        out = io.StringIO()
        try:
            call_command('migrate', interactive=False, stdout=out)
            result = out.getvalue()
            return Response({"message": "Migrations successful", "output": result})
        except Exception as e:
            return Response({"message": "Migration failed", "error": str(e)}, status=500)

class DataImportView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Return a simple HTML form for uploading the JSON file
        html = f"""
        <html>
        <head><title>XSchool Data Importer</title></head>
        <body style="font-family: sans-serif; padding: 50px;">
            <h2>📦 Importation de données (JSON)</h2>
            <p>Utilisez cette page pour importer votre fichier <code>db.json</code> créé avec <code>dumpdata</code>.</p>
            <form method="post" enctype="multipart/form-data" style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; max-width: 500px;">
                <div style="margin-bottom: 15px;">
                    <label>Jeton de sécurité (MIGRATION_TOKEN) :</label><br>
                    <input type="password" name="token" style="width: 100%; padding: 8px;" required>
                </div>
                <div style="margin-bottom: 15px;">
                    <label>Fichier JSON de données :</label><br>
                    <input type="file" name="data_file" accept=".json" required>
                </div>
                <div style="margin-bottom: 15px; padding: 10px; background: #fff3e0; border-radius: 4px;">
                    <input type="checkbox" name="clear_data" id="clear_data">
                    <label for="clear_data" style="color: #e65100; font-weight: bold;">
                        ⚠️ Vider la base de données avant l'importation
                    </label>
                    <p style="margin: 5px 0 0 25px; font-size: 0.8em; color: #666;">
                        Recommandé pour éviter les erreurs "Duplicate Key" si vous importez tout votre projet local.
                    </p>
                </div>
                <button type="submit" style="background: #1976d2; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; width: 100%;">
                    Lancer l'importation
                </button>
            </form>
        </body>
        </html>
        """
        return HttpResponse(html)

    def post(self, request):
        token = request.data.get('token')
        if token != settings.MIGRATION_TOKEN:
            return Response({"error": "Invalid token"}, status=403)
        
        data_file = request.FILES.get('data_file')
        if not data_file:
            return Response({"error": "No file uploaded"}, status=400)

        clear_data = request.data.get('clear_data') == 'on'

        if clear_data:
            # Clear main application data to avoid integrity errors
            from school.models import Student, Class, SchoolConfiguration, SchoolYear
            from accounts.models import User
            from finance.models import Payment, Expense
            from agenda.models import CalendarEvent
            from tenants.models import Establishment
            
            # Order matters for foreign keys
            CalendarEvent.objects.all().delete()
            Payment.objects.all().delete()
            Expense.objects.all().delete()
            Student.objects.all().delete()
            Class.objects.all().delete()
            User.objects.all().delete()
            SchoolConfiguration.objects.all().delete()
            # Shared models
            Establishment.objects.all().delete()
            SchoolYear.objects.all().delete()
            print("Database cleared as requested.")

        # Save uploaded file to a temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp:
            for chunk in data_file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        out = io.StringIO()
        try:
            # Run loaddata on the temporary file with natural keys
            call_command('loaddata', tmp_path, stdout=out, natural_foreign=True, natural_primary=True)
            result = out.getvalue()
            
            # Post-import verification counts
            counts = {
                "establishments": Establishment.objects.count(),
                "users": User.objects.count(),
                "students": Student.objects.count(),
                "classes": Class.objects.count(),
                "payments": Payment.objects.count(),
            }
            
            return Response({
                "message": "Data imported successfully",
                "output": result,
                "counts": counts
            })
        except Exception as e:
            return Response({
                "message": "Data import failed",
                "error": str(e),
                "traceback": traceback.format_exc()
            }, status=500)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
