from .models import set_current_tenant, set_bypass_tenant

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 2. Authenticate User (Session or JWT)
        set_bypass_tenant(True) # Temporary bypass to allow User lookup if needed
        user = request.user
        
        # In DRF, request.user might not be authenticated yet (JWT runs at View layer)
        if not user or not user.is_authenticated:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            try:
                auth_result = JWTAuthentication().authenticate(request)
                if auth_result:
                    user, token = auth_result
                    request.user = user # SYNC: Ensure view objects see the authenticated user
            except Exception:
                pass
        
        set_bypass_tenant(False) # Strict by default

        # 3. Determine Tenant Context
        if user and user.is_authenticated:
            is_super = user.is_superuser or user.username == 'admin'
            tenant_id = request.headers.get('X-Tenant-ID')

            if is_super:
                if tenant_id:
                    from .models import Establishment
                    try:
                        tenant = Establishment.objects.get(id=tenant_id)
                        set_current_tenant(tenant)
                        set_bypass_tenant(False) # STRICT: Impersonation mode
                    except (Establishment.DoesNotExist, ValueError):
                        set_bypass_tenant(True) # Fallback to Global if ID invalid
                else:
                    set_bypass_tenant(True) # GLOBAL: Mission Control Mode
            else:
                # Regular User: Strictly tied to their own establishment
                tenant = getattr(user, 'establishment', None)
                if tenant:
                    set_current_tenant(tenant)
                    set_bypass_tenant(False)
                else:
                    # Security fail-safe: No school = No data
                    set_bypass_tenant(False)
                    set_current_tenant(None)
        else:
            # Anonymous users: strict isolation (usually no data access)
            set_bypass_tenant(False)

        response = self.get_response(request)
        
        # 5. Full cleanup
        set_current_tenant(None)
        set_bypass_tenant(False)
        return response
