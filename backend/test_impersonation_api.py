import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from tenants.middleware import TenantMiddleware
from rest_framework.test import APIRequestFactory
from accounts.models import User
from tenants.models import Establishment

try:
    factory = APIRequestFactory()
    request = factory.get('/api/dashboard/', HTTP_X_TENANT_ID=str(Establishment.objects.first().id))
    user = User.objects.filter(is_superuser=True).first()
    request.user = user
    
    def dummy_get_response(req):
        from django.http import HttpResponse
        return HttpResponse("OK")
        
    middleware = TenantMiddleware(dummy_get_response)
    response = middleware(request)
    print("STATUS MATCH:", response.status_code == 200)
except Exception as e:
    import traceback
    traceback.print_exc()
