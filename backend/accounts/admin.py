from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Notification

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'establishment', 'is_staff')
    list_filter = ('establishment', 'role', 'is_staff', 'is_superuser', 'is_locked')
    fieldsets = UserAdmin.fieldsets + (
        ('Informations XSchool', {'fields': ('role', 'establishment', 'avatar', 'is_locked')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations XSchool', {'fields': ('role', 'establishment', 'avatar')}),
    )

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'type', 'is_read', 'created_at', 'establishment')
    list_filter = ('establishment', 'type', 'is_read')
    search_fields = ('title', 'message', 'user__username')
    date_hierarchy = 'created_at'
