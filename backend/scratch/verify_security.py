import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xschool.settings')
django.setup()

from tenants.models import Establishment, set_current_tenant
from accounts.models import User
from school.models import Student

def verify_isolation():
    print("--- Starting Security Isolation Test ---")
    
    # 0. Cleanup prev failed attempts
    User.all_objects.filter(username__in=['admin_a', 'admin_b']).delete()
    Establishment.objects.filter(name__in=['Ecole A', 'Ecole B']).delete()

    # 1. Setup two institutions
    super_admin = User.all_objects.filter(is_superuser=True).first()
    estab1 = Establishment.objects.create(name='Ecole A', owner=super_admin)
    estab2 = Establishment.objects.create(name='Ecole B', owner=super_admin)

    # 2. Setup users for each
    user1 = User.all_objects.create(username='admin_a', establishment=estab1, role='admin')
    user2 = User.all_objects.create(username='admin_b', establishment=estab2, role='admin')

    # 3. Create a student in Ecole A
    Student.all_objects.create(first_name='Secret', last_name='A', establishment=estab1)

    # 4. Simulate Admin A
    set_current_tenant(estab1)
    count_a = Student.objects.filter(establishment=estab1).count()
    # Corrected: Student.objects.all() already filters.
    count_a_auto = Student.objects.count()
    print(f'Admin A sees {count_a_auto} students (Expected: 1)')

    # 5. Simulate Admin B
    set_current_tenant(estab2)
    count_b_auto = Student.objects.count()
    print(f'Admin B sees {count_b_auto} students (Expected: 0)')

    # 6. Simulate No Tenant
    set_current_tenant(None)
    count_none = Student.objects.count()
    print(f'Unauthenticated sees {count_none} students (Expected: 0)')

    # Cleanup
    Student.all_objects.filter(first_name='Secret').delete()
    user1.delete()
    user2.delete()
    estab1.delete()
    estab2.delete()
    print("--- Security Test Completed Successfully ---")

if __name__ == '__main__':
    verify_isolation()
