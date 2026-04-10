import datetime
from django.core.management.base import BaseCommand
from accounts.models import User
from school.models import SchoolYear, Class, Student, Subject, Period, Grade
from finance.models import TrancheConfig, Payment, Expense
from agenda.models import CalendarEvent

class Command(BaseCommand):
    help = 'Seeds the database with initial school data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')
        
        # 1. Create Users
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@xschool.com', 'role': 'admin', 'is_staff': True, 'is_superuser': True}
        )
        admin_user.set_password('admin123')
        admin_user.save()
        
        claire, _ = User.objects.get_or_create(
            username='claire',
            defaults={'email': 'claire@xschool.com', 'role': 'comptable', 'first_name': 'Claire', 'last_name': ''}
        )
        claire.set_password('claire123')
        claire.save()
        
        laurent, _ = User.objects.get_or_create(
            username='laurent',
            defaults={'email': 'laurent@xschool.com', 'role': 'professeur', 'first_name': 'Laurent', 'last_name': ''}
        )
        laurent.set_password('laurent123')
        laurent.save()

        # 2. School Year
        sy2024, _ = SchoolYear.objects.get_or_create(year='2024-2025')
        
        # 3. Classes & Tranches
        classes_data = [
            {'name': '6ème A', 'level': '6ème'},
            {'name': '6ème B', 'level': '6ème'},
            {'name': '5ème A', 'level': '5ème'},
        ]
        
        for c_data in classes_data:
            obj, _ = Class.objects.get_or_create(
                name=c_data['name'], 
                level=c_data['level'],
                school_year=sy2024
            )
            # Create standard tranches for each class
            TrancheConfig.objects.get_or_create(school_class=obj, name='Inscription', amount=50000, due_date='2024-09-01')
            TrancheConfig.objects.get_or_create(school_class=obj, name='Tranche 1', amount=75000, due_date='2024-10-15')
            TrancheConfig.objects.get_or_create(school_class=obj, name='Tranche 2', amount=75000, due_date='2024-12-15')

        # 4. Students
        c1 = Class.objects.get(name='6ème A')
        s1, _ = Student.objects.get_or_create(
            matricule='XS2024001',
            defaults={
                'first_name': 'Emma', 'last_name': 'Kouam', 
                'date_of_birth': '2012-03-15', 'gender': 'F',
                'address': 'Rue 123, Yaoundé', 'parent_name': 'M. Kouam Jean',
                'parent_phone': '+237 6XX XXX XXX', 'school_class': c1,
                'status': 'active'
            }
        )
        
        # 5. Subjects & Periods
        math, _ = Subject.objects.get_or_create(name='Mathématiques', coefficient=4)
        french, _ = Subject.objects.get_or_create(name='Français', coefficient=3)
        
        p1, _ = Period.objects.get_or_create(
            name='Premier Trimestre', 
            start_date='2024-09-01', end_date='2024-11-30',
            school_year=sy2024
        )
        
        # 6. Grades
        Grade.objects.get_or_create(
            student=s1, subject=math, period=p1,
            value=15.5, max_value=20, teacher=laurent
        )

        # 7. Payments
        tranche_ins = TrancheConfig.objects.get(school_class=c1, name='Inscription')
        Payment.objects.get_or_create(
            student=s1, tranche=tranche_ins,
            amount_paid=50000, amount_expected=50000,
            date='2024-09-01', mode='cash', receipt_number='REC-001',
            recorded_by=claire
        )

        # 8. Expenses
        Expense.objects.get_or_create(
            description='Achat de fournitures scolaires',
            amount=250000, date='2024-09-05',
            category='Fournitures', recorded_by=claire
        )

        # 9. Events
        CalendarEvent.objects.get_or_create(
            title='Rentrée Scolaire',
            start_date='2024-09-02T08:00:00Z',
            end_date='2024-09-02T17:00:00Z',
            type='other', all_day=True
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded data'))
