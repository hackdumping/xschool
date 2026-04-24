import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from tenants.models import Establishment
from school.models import SchoolConfiguration
from school.serializers import SchoolConfigurationSerializer

def diag():
    print("--- User Check ---")
    for user in User.objects.all():
        print(f"User: {user.username}, Role: {user.role}, Establishment: {user.establishment.name if user.establishment else 'None'}")
    
    print("\n--- Establishment Check ---")
    for est in Establishment.objects.all():
        print(f"Est: {est.name}, Owner: {est.owner.username}, Types: {est.selected_types}")
    
    print("\n--- SchoolConfiguration Check ---")
    for config in SchoolConfiguration.all_objects.all():
        print(f"Config: {config.name}, Establishment: {config.establishment.name}")
        serializer = SchoolConfigurationSerializer(config)
        print(f"Serialized selected_types: {serializer.data.get('selected_types')}")

if __name__ == "__main__":
    diag()
