from rest_framework import serializers
from .models import CalendarEvent
from school.models import Class

class CalendarEventSerializer(serializers.ModelSerializer):
    startDate = serializers.DateTimeField(source='start_date')
    endDate = serializers.DateTimeField(source='end_date')
    allDay = serializers.BooleanField(source='all_day')
    classIds = serializers.PrimaryKeyRelatedField(
        many=True, source='classes', queryset=Class.objects.all(), required=False
    )
    
    class Meta:
        model = CalendarEvent
        fields = ['id', 'title', 'description', 'startDate', 'endDate', 'type', 'allDay', 'classIds']
