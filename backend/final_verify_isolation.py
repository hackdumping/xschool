import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tenants.models import Establishment, set_current_tenant, set_bypass_tenant
from school.models import Student, Class
from core.views import DashboardStatsView
from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.models import User

admin = User.objects.get(username='admin')
factory = APIRequestFactory()
view = DashboardStatsView.as_view()

def test_dashboard(tenant=None, bypass=False):
    desc = f"SCHOOL: {tenant.name}" if tenant else "GLOBAL"
    print(f"\n--- Testing {desc} ---")
    
    set_current_tenant(tenant)
    set_bypass_tenant(bypass)
    
    headers = {}
    if tenant:
        headers['HTTP_X_TENANT_ID'] = str(tenant.id)
    
    request = factory.get('/dashboard/', **headers)
    force_authenticate(request, user=admin)
    
    response = view(request)
    data = response.data
    
    print(f"  Total Students: {data['totalStudents']}")
    print(f"  Total Classes: {data['totalClasses']}")
    print(f"  Recovery Rate: {data['globalRecoveryRate']}%")
    
    # Check if student counts match DB for that tenant
    if tenant:
        expected = Student.all_objects.filter(establishment=tenant, status='active').count()
        if data['totalStudents'] == expected:
            print(f"  ✅ ISOLATION OK (Matches count {expected})")
        else:
            print(f"  ❌ ISOLATION FAILED (Got {data['totalStudents']}, expected {expected})")

# Verify
school1 = Establishment.objects.get(id=1)
school2 = Establishment.objects.get(id=2)

test_dashboard(None, True) # Global
test_dashboard(school1, False) # XSchool
test_dashboard(school2, False) # Ecole Dumping

