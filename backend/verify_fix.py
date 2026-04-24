import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tenants.models import Establishment, set_current_tenant
from school.models import SchoolConfiguration
from school.serializers import SchoolConfigurationSerializer

def check_school(eid):
    est = Establishment.objects.get(id=eid)
    # Correctly simulate the view context
    set_current_tenant(est)
    
    # Use the same logic as the patched view
    config, _ = SchoolConfiguration.all_objects.get_or_create(establishment=est)
    serializer = SchoolConfigurationSerializer(config)
    
    print(f"\nResults for {est.name} (ID {eid}):")
    print(f"  DB Types on Establishment: {est.selected_types}")
    print(f"  Types in Serialized Settings: {serializer.data.get('selected_types')}")

check_school(1)
check_school(2)
