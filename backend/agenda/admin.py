from django.contrib import admin
from .models import CalendarEvent

@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'start_date', 'end_date', 'establishment', 'all_day')
    list_filter = ('establishment', 'type', 'all_day')
    search_fields = ('title', 'description')
    date_hierarchy = 'start_date'
