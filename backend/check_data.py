import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tenants.models import Establishment, get_current_tenant, set_current_tenant, set_bypass_tenant
from school.models import Student

estabs = Establishment.objects.all()
for e in estabs:
    print(f"[{e.id}] {e.name}")
    set_current_tenant(e)
    set_bypass_tenant(False)
    students = Student.objects.count()
    print(f"  -> Students: {students}")

print("\nBYPASSING TENANT")
set_bypass_tenant(True)
all_s = Student.objects.count()
print("  -> Total Students:", all_s)

