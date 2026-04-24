import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tenants.middleware import TenantMiddleware
from accounts.views import EstablishmentViewSet
from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.models import User
from tenants.models import Establishment

try:
    factory = APIRequestFactory()
    req = factory.get('/api/users/establishments/', HTTP_X_TENANT_ID=str(Establishment.objects.last().id))
    user = User.objects.filter(is_superuser=True).first()
    force_authenticate(req, user=user)
    
    def dummy_get_response(request):
        view = EstablishmentViewSet.as_view({'get': 'list'})
        return view(request)
        
    middleware = TenantMiddleware(dummy_get_response)
    response = middleware(req)
    response.render()
    import json
    print("ESTABLISHMENTS RETURNED:", len(json.loads(response.content)))

except Exception as e:
    import traceback
    traceback.print_exc()
