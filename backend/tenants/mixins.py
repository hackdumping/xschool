from .models import get_current_tenant, is_tenant_bypassed

class TenantScopedViewSetMixin:
    """
    SOLID-compliant mixin for ViewSets that need dynamic establishment-based filtering.
    Fixes static evaluation issues by resolving the model queryset dynamically at request time.
    """
    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return getattr(self, 'queryset', None).model.objects.none() if hasattr(self, 'queryset') else None
        
        # Resolve the model
        model = getattr(self, 'queryset', None).model if hasattr(self, 'queryset') and self.queryset is not None else None
        if not model:
            return super().get_queryset()

        tenant = get_current_tenant()
        is_bypassed = is_tenant_bypassed()

        # 1. SuperAdmin (admin) Logic
        if user.is_superuser or user.username == 'admin':
            # Check for explicit impersonation header presence to be extra safe
            has_tenant_header = self.request.headers.get('X-Tenant-ID')
            
            if has_tenant_header and tenant and not is_bypassed:
                # STRICT IMPERSONATION: Only show target school data
                return model.all_objects.filter(establishment=tenant)
            
            if is_bypassed and not has_tenant_header:
                # GLOBAL VIEW: Mission Control Mode
                return model.all_objects.all()
                
            # If header sent but tenant missing or bypassed incorrectly, default to safe none() or global
            # to avoid mixing.
            return model.all_objects.all() if is_bypassed else model.all_objects.none()

        # 2. Regular User Logic: Strictly isolated by middleware's resolved tenant
        if tenant and not is_bypassed:
            return model.all_objects.filter(establishment=tenant)
        
        # Security fail-safe: return nothing if no tenant context is established
        return model.all_objects.none()
