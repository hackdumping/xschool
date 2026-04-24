import os
import django
from django.test import RequestFactory
from rest_framework.request import Request

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from school.views import SchoolConfigurationViewSet
from tenants.models import Establishment

factory = RequestFactory()
admin = User.objects.get(username='admin')

def test_settings(tenant_id=None):
    headers = {}
    if tenant_id:
        headers['HTTP_X_TENANT_ID'] = str(tenant_id)
    
    django_request = factory.get('/api/school/settings/', **headers)
    django_request.user = admin
    
    # Wrap in DRF Request to simulate middleware/view behavior
    drf_request = Request(django_request)
    
    view = SchoolConfigurationViewSet.as_view({'get': 'school_settings'})
    response = view(drf_request)
    
    print(f"\n--- Testing with X-Tenant-ID: {tenant_id} ---")
    if response.status_code == 200:
        print(f"Name: {response.data.get('establishment_name')}")
        print(f"Types: {response.data.get('selected_types')}")
    else:
        print(f"Error {response.status_code}: {response.data}")

# Test 1: Global (No tenant)
test_settings()

# Test 2: School 1 (XSchool Principale)
test_settings(1)

# Test 3: School 2 (Ecole Dumping)
test_settings(2)
