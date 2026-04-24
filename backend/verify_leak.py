import os
import django
from rest_framework import serializers

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from accounts.serializers import UserSerializer
from tenants.models import Establishment, set_current_tenant

admin = User.objects.get(username='admin')

# 1. Global Mode (No tenant)
set_current_tenant(None)
data_global = UserSerializer(admin).data
print("\n[GLOBAL MODE]")
print(f"User: {data_global['username']}")
print(f"Est Info: {data_global['establishment_info'].get('name') if data_global['establishment_info'] else 'None'}")

# 2. Impersonation Mode (School 2 - Ecole Dumping)
try:
    school2 = Establishment.objects.get(id=2)
    set_current_tenant(school2)
    data_impersonation = UserSerializer(admin).data
    print("\n[IMPERSONATION MODE - SCHOOL 2]")
    print(f"User: {data_impersonation['username']}")
    print(f"Target School Name: {school2.name}")
    print(f"Est Info in Profile: {data_impersonation['establishment_info'].get('name')}")
    print(f"Est Types in Profile: {data_impersonation['establishment_info'].get('selected_types')}")
except Exception as e:
    print(f"Error checking school 2: {e}")

