import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from core.admin_views import GlobalMonitorView
from rest_framework.test import APIRequestFactory, force_authenticate
from accounts.models import User
from tenants.models import Establishment

try:
    factory = APIRequestFactory()
    request = factory.get('/api/admin/monitor/', HTTP_X_TENANT_ID=str(Establishment.objects.first().id))
    user = User.objects.filter(is_superuser=True).first()
    force_authenticate(request, user=user)
    
    view = GlobalMonitorView.as_view()
    response = view(request)
    print("STATUS:", response.status_code)
    print("DATA:", list(response.data.keys()))
    print("KPIS:", response.data['kpis'])
except Exception as e:
    import traceback
    traceback.print_exc()
