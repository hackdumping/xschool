import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from core.views import DashboardStatsView
from tenants.middleware import TenantMiddleware
from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.models import User
from tenants.models import Establishment
import json

try:
    estabs = list(Establishment.objects.all())
    
    e1 = estabs[0]
    e2 = estabs[1]
    
    factory = APIRequestFactory()
    user = User.objects.filter(is_superuser=True).first()
    
    def simulate_request(estab):
        req = factory.get('/api/dashboard/', HTTP_X_TENANT_ID=str(estab.id))
        force_authenticate(req, user=user)
        
        def dummy_get_response(request):
            view = DashboardStatsView.as_view()
            return view(request)
            
        middleware = TenantMiddleware(dummy_get_response)
        response = middleware(req)
        response.render()
        return response

    resp1 = simulate_request(e1)
    print("STATUS E1:", resp1.status_code)
    try:
        print("DATA E1:", json.loads(resp1.content))
    except:
        pass
        
    resp2 = simulate_request(e2)

except Exception as e:
    import traceback
    traceback.print_exc()
