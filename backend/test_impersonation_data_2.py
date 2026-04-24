import os
import sys
import django
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from core.views import DashboardStatsView
from tenants.middleware import TenantMiddleware
from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.models import User
from tenants.models import Establishment

try:
    estabs = list(Establishment.objects.all())
    
    e1 = estabs[0]
    e2 = estabs[1]
    
    factory = APIRequestFactory()
    user = User.objects.filter(is_superuser=True).first()
    
    def simulate_request(estab):
        # We must use standard DRF factory
        req = factory.get('/api/dashboard/', HTTP_X_TENANT_ID=str(estab.id))
        force_authenticate(req, user=user)
        
        view = DashboardStatsView.as_view()
        
        # Manually apply what the middleware DOES to the thread locals:
        from tenants.models import set_current_tenant, set_bypass_tenant
        set_current_tenant(estab)
        set_bypass_tenant(False)
        
        response = view(req)
        response.render()
        
        set_current_tenant(None)
        
        return json.loads(response.content)

    resp1 = simulate_request(e1)
    print(f"E1 STATUS ({e1.name}): OK")
    print(f"E1 STUDENTS: {resp1.get('totalStudents')}")
    
    resp2 = simulate_request(e2)
    print(f"E2 STATUS ({e2.name}): OK")
    print(f"E2 STUDENTS: {resp2.get('totalStudents')}")

except Exception as e:
    import traceback
    traceback.print_exc()
