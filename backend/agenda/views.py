from rest_framework import viewsets, permissions
from .models import CalendarEvent
from .serializers import CalendarEventSerializer
from tenants.mixins import TenantScopedViewSetMixin

class CalendarEventViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer
    permission_classes = [permissions.IsAuthenticated]
