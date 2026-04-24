import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tenants.models import Establishment, set_current_tenant, set_bypass_tenant
from school.models import SchoolConfiguration
from school.serializers import SchoolConfigurationSerializer

# Simulate impersonating "Ecole Dumping" (ID 2)
tenant = Establishment.objects.get(id=2)
set_current_tenant(tenant)
set_bypass_tenant(False)

# This mimics the view
config = SchoolConfiguration.objects.filter(establishment=tenant).first()
if getattr(config, 'pk', None):
    print("Found config:", config.id)
else:
    print("No config found")
    config = SchoolConfiguration(establishment=tenant)

print("Tenant's actual selected_types:", tenant.selected_types)

serializer = SchoolConfigurationSerializer(config)
print("Serialized data:", serializer.data.get('selected_types', 'NOT_FOUND'))
