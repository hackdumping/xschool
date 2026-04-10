from django.db import models

class CalendarEvent(models.Model):
    EVENT_TYPE_CHOICES = (
        ('exam', 'Examen'),
        ('meeting', 'Réunion'),
        ('holiday', 'Vacances'),
        ('activity', 'Activité'),
        ('other', 'Autre'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES)
    all_day = models.BooleanField(default=False)
    classes = models.ManyToManyField('school.Class', related_name='events', blank=True)

    def __str__(self):
        return f"{self.title} ({self.type})"
