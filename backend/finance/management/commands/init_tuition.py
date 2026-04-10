from django.core.management.base import BaseCommand
from django.utils import timezone
from school.models import SchoolYear, Class, SchoolConfiguration, Student, Subject, Period, Grade
from finance.models import TuitionTemplate, Payment, Expense, TrancheConfig
from agenda.models import CalendarEvent
from accounts.models import User
import datetime

class Command(BaseCommand):
    help = 'STRICT Cleanup and initialization with INDIVIDUAL templates for each class'

    def handle(self, *args, **kwargs):
        self.stdout.write('Purging existing data...')
        
        Grade.objects.all().delete()
        Payment.objects.all().delete()
        Expense.objects.all().delete()
        CalendarEvent.objects.all().delete()
        Student.objects.all().delete()
        Subject.objects.all().delete()
        Period.objects.all().delete()
        TrancheConfig.objects.all().delete()
        Class.objects.all().delete()
        TuitionTemplate.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS('Purge complete.'))

        sy, _ = SchoolYear.objects.get_or_create(year="2024-2025")
        
        config = SchoolConfiguration.objects.first() or SchoolConfiguration.objects.create()
        config.tranche_1_deadline = datetime.date(2024, 10, 15)
        config.tranche_2_deadline = datetime.date(2024, 12, 15)
        config.tranche_3_deadline = datetime.date(2025, 2, 15)
        config.save()

        # Config per class (Individualized as requested)
        general_classes = [
            {'names': ['6ème', '5ème'], 'reg': 30000, 't1': 20000, 't2': 15000, 't3': 5000, 'mat': 0},
            {'names': ['4ème'], 'reg': 30000, 't1': 25000, 't2': 15000, 't3': 5000, 'mat': 0},
            {'names': ['3ème'], 'reg': 30000, 't1': 35000, 't2': 10000, 't3': 0, 'mat': 0},
            {'names': ['2nde A', '2nde C'], 'reg': 35000, 't1': 30000, 't2': 15000, 't3': 5000, 'mat': 0},
            {'names': ['1ère A', '1ère C', '1ère D'], 'reg': 35000, 't1': 35000, 't2': 20000, 't3': 0, 'mat': 0},
            {'names': ['Tle A', 'Tle C', 'Tle D'], 'reg': 35000, 't1': 40000, 't2': 25000, 't3': 0, 'mat': 0},
        ]

        technique_classes = [
            {'names': ['1ère Année', '2ème Année', '3ème Année', '4ème Année'], 'reg': 30000, 't1': 25000, 't2': 15000, 't3': 5000, 'mat': 5000},
            {'names': ['2nde', '1ère', 'Tle'], 'reg': 35000, 't1': 35000, 't2': 25000, 't3': 0, 'mat': 10000},
        ]

        # Function to create ONE TEMPLATE PER CLASS to be "nette"
        def create_individual_data(data_list, category):
            for group in data_list:
                for c_name in group['names']:
                    tpl = TuitionTemplate.objects.create(
                        name=c_name, # Name template directly after the class
                        category=category,
                        registration_fee=group['reg'],
                        tranche_1=group['t1'],
                        tranche_2=group['t2'],
                        tranche_3=group['t3'],
                        material_fee=group['mat']
                    )
                    cls = Class.objects.create(
                        name=c_name,
                        school_year=sy,
                        level=c_name,
                        category=category,
                        tuition_template=tpl,
                        max_size=50
                    )
                    self.stdout.write(f"Created: {c_name} ({category})")

        create_individual_data(general_classes, 'general')
        create_individual_data(technique_classes, 'technique')
        
        self.stdout.write(self.style.SUCCESS(f'STRICT Individual Initialization complete.'))
