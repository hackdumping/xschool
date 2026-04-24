from django.db import models
from django.contrib.auth.models import AbstractUser

from tenants.models import TenantModel

class User(AbstractUser, TenantModel):
    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('comptable', 'Comptable'),
        ('secretaire', 'Secrétaire'),
        ('professeur', 'Professeur'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='admin')
    establishment = models.ForeignKey('tenants.Establishment', on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    last_failed_login = models.DateTimeField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

from tenants.models import TenantModel

class Notification(TenantModel):
    TYPES = (
        ('info', 'Information'),
        ('success', 'Succès'),
        ('warning', 'Avertissement'),
        ('error', 'Erreur'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPES, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.user.username}"
