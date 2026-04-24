from django.db import models
from django.conf import settings
import threading

# Thread-local storage for current tenant
_thread_locals = threading.local()

def set_current_tenant(tenant):
    _thread_locals.tenant = tenant

def get_current_tenant():
    return getattr(_thread_locals, 'tenant', None)

def set_bypass_tenant(bypass=True):
    _thread_locals.bypass_tenant = bypass

def is_tenant_bypassed():
    return getattr(_thread_locals, 'bypass_tenant', False)

class Establishment(models.Model):
    TYPES = (
        ('garderie', 'Garderie'),
        ('primaire', 'ÉCOLE PRIMAIRE'),
        ('general', 'Enseignement Général'),
        ('technique', 'Enseignement Technique'),
        ('formation', 'Centre de formation'),
    )
    
    name = models.CharField(max_length=200)
    # Stored as a comma-separated string or a list of types
    # e.g. "garderie,primaire"
    selected_types = models.JSONField(default=list)
    
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    logo = models.ImageField(upload_to='establishment_logos/', null=True, blank=True)
    
    owner = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='owned_establishments')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class TenantManager(models.Manager):
    def get_queryset(self):
        if is_tenant_bypassed():
            return super().get_queryset()
            
        tenant = get_current_tenant()
        queryset = super().get_queryset()
        if tenant:
            return queryset.filter(establishment=tenant)
        # Return empty queryset if no tenant is set (SaaS Security)
        return queryset.none()

class TenantModel(models.Model):
    establishment = models.ForeignKey(Establishment, on_delete=models.CASCADE, null=True, blank=True)
    
    objects = TenantManager()
    # Also expose original manager if needed for admin
    all_objects = models.Manager()
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        # Auto-assign current tenant if not set
        if not hasattr(self, 'establishment') or self.establishment_id is None:
            tenant = get_current_tenant()
            if tenant:
                self.establishment = tenant
        super().save(*args, **kwargs)
