import os
import django
from django.test import RequestFactory
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from school.views import SchoolConfigurationViewSet

User = get_user_model()

def test_viewset_action():
    try:
        factory = APIRequestFactory()
        view = SchoolConfigurationViewSet.as_view({'get': 'settings'})
        
        user = User.objects.first()
        if not user:
            print("No user found for authentication")
            return
            
        request = factory.get('/api/school/settings/')
        force_authenticate(request, user=user)
        
        response = view(request)
        print(f"Status Code: {response.status_code}")
        print(f"Response Data: {response.data}")
        
    except Exception as e:
        import traceback
        print("Traceback captured:")
        print(traceback.format_exc())

if __name__ == "__main__":
    test_viewset_action()
