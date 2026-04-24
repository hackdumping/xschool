import os
import sys
import django
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tenants.models import Establishment
from school.models import Student
from finance.models import Payment
from django.db.models import Sum

all_estabs = Establishment.objects.all().select_related('owner')

for estab in all_estabs:
    est_students = Student.all_objects.filter(establishment=estab).count()
    est_revenue = float(Payment.all_objects.filter(establishment=estab).aggregate(total=Sum('amount_paid'))['total'] or 0)
    
    print(f"[{estab.name}] -> Students: {est_students} | Revenue: {est_revenue}")

