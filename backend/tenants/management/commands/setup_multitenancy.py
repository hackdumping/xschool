from django.core.management.base import BaseCommand
from tenants.models import Establishment
from accounts.models import User
from school.models import SchoolYear, Class, Student, Subject, Period, Grade, SchoolConfiguration
from finance.models import TuitionTemplate, TrancheConfig, Payment, Expense
from agenda.models import CalendarEvent

class Command(BaseCommand):
    help = 'Assigns existing data to a default establishment'

    def handle(self, *args, **options):
        # 1. Get or Create Default User if none exists (just in case)
        owner = User.objects.filter(is_superuser=True).first()
        if not owner:
            self.stdout.write(self.style.ERROR('No superuser found to own the default establishment'))
            return

        # 2. Create Default Establishment
        establishment, created = Establishment.objects.get_or_create(
            name='XSchool Principale',
            defaults={
                'owner': owner,
                'selected_types': ['general', 'technique'],
                'address': 'Yaoundé, Cameroun'
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created default establishment: {establishment.name}'))
        else:
            self.stdout.write(self.style.WARNING(f'Using existing establishment: {establishment.name}'))

        # 3. Assign all Users
        count = User.objects.filter(establishment__isnull=True).update(establishment=establishment)
        self.stdout.write(f'Updated {count} users')

        # 4. List of all tenant models
        models = [
            SchoolYear, Class, Student, Subject, Period, Grade, 
            SchoolConfiguration, TuitionTemplate, TrancheConfig, 
            Payment, Expense, CalendarEvent
        ]

        for model in models:
            count = model.objects.filter(establishment__isnull=True).update(establishment=establishment)
            self.stdout.write(f'Updated {count} records for {model.__name__}')

        self.stdout.write(self.style.SUCCESS('Data migration completed successfully'))
