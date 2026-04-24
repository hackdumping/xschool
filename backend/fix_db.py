import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tenants.models import Establishment, set_bypass_tenant
from school.models import SchoolConfiguration

set_bypass_tenant(True)

print("Original stats:")
print(SchoolConfiguration.objects.all().values('id', 'establishment_id', 'name'))

# Keep only the first configuration for each establishment
kept = set()
deleted_count = 0
for config in SchoolConfiguration.objects.all().order_by('id'):
    if config.establishment_id in kept:
        config.delete()
        deleted_count += 1
    else:
        kept.add(config.establishment_id)

print(f"Deleted {deleted_count} duplicate SchoolConfigurations.")

# Let's see what types are in SchoolConfiguration for Ecole Dumping
dumping = Establishment.objects.get(id=2)
print("Ecole Dumping types in DB:", dumping.selected_types)

config2 = SchoolConfiguration.objects.filter(establishment_id=2).first()
if config2:
    from school.serializers import SchoolConfigurationSerializer
    # Fake serialization
    data = SchoolConfigurationSerializer(config2).data
    print("Ecole Dumping config serialization selected_types:", data.get('selected_types'))

