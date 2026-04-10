import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from school.models import SchoolConfiguration
from school.serializers import SchoolConfigurationSerializer

def test_config():
    try:
        config, created = SchoolConfiguration.objects.get_or_create(id=1)
        print(f"Config ID: {config.id}, Created: {created}")
        print(f"Current Name: {config.name}")
        
        data = {'name': 'Updated School Test'}
        serializer = SchoolConfigurationSerializer(config, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            print("Successfully updated via serializer")
        else:
            print(f"Serializer errors: {serializer.errors}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_config()
