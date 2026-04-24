from django.db import models
from tenants.models import TenantModel

class TuitionTemplate(TenantModel):
    CATEGORY_CHOICES = (
        ('general', 'Enseignement Général'),
        ('technique', 'Enseignement Technique'),
    )
    name = models.CharField(max_length=100) # e.g. "6ème & 5ème"
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    registration_fee = models.DecimalField(max_digits=12, decimal_places=2)
    tranche_1 = models.DecimalField(max_digits=12, decimal_places=2)
    tranche_2 = models.DecimalField(max_digits=12, decimal_places=2)
    tranche_3 = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    material_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Matière d'œuvre
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        self.sync_classes()

    def sync_classes(self):
        """Synchronize TrancheConfigs for all classes using this template."""
        from school.models import SchoolConfiguration, SchoolYear
        config = SchoolConfiguration.objects.first()
        # Default dates if config not set
        d1 = config.tranche_1_deadline if config else None
        d2 = config.tranche_2_deadline if config else None
        d3 = config.tranche_3_deadline if config else None
        
        # We need a fallback date for Inscription/Material (start of year)
        # Assuming current active year start date
        from django.utils import timezone
        today = timezone.now().date()
        
        for cls in self.classes.all():
            self._sync_class_tranches(cls, d1, d2, d3, today)

    def _sync_class_tranches(self, cls, d1, d2, d3, start_date):
        tranches_data = [
            ('Inscription', self.registration_fee, start_date),
            ('Tranche 1', self.tranche_1, d1 or start_date),
            ('Tranche 2', self.tranche_2, d2 or start_date),
            ('Tranche 3', self.tranche_3, d3 or start_date),
            ('Matière d\'œuvre', self.material_fee, start_date),
        ]
        
        from .models import TrancheConfig
        for name, amount, due_date in tranches_data:
            if amount > 0 or name == 'Inscription':
                TrancheConfig.objects.update_or_create(
                    school_class=cls,
                    name=name,
                    defaults={'amount': amount, 'due_date': due_date or start_date}
                )
            else:
                # Remove if amount is 0 (except for Inscription maybe)
                TrancheConfig.objects.filter(school_class=cls, name=name).delete()

class TrancheConfig(TenantModel):
    school_class = models.ForeignKey('school.Class', on_delete=models.CASCADE, related_name='tranches')
    name = models.CharField(max_length=100) # e.g. "Inscription", "Tranche 1"
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()

    def __str__(self):
        return f"{self.name} - {self.school_class} ({self.amount})"

class Payment(TenantModel):
    MODE_CHOICES = (
        ('cash', 'Espèces'),
        ('check', 'Chèque'),
        ('transfer', 'Virement'),
        ('mobile', 'Mobile Money'),
    )
    
    student = models.ForeignKey('school.Student', on_delete=models.CASCADE, related_name='payments')
    tranche = models.ForeignKey(TrancheConfig, on_delete=models.CASCADE, related_name='payments')
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    amount_expected = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    mode = models.CharField(max_length=20, choices=MODE_CHOICES)
    receipt_number = models.CharField(max_length=50)
    
    class Meta:
        unique_together = ('receipt_number', 'establishment')
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, limit_choices_to={'role__in': ['admin', 'comptable']})
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.receipt_number} - {self.student}: {self.amount_paid}"

class Expense(TenantModel):
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    category = models.CharField(max_length=100)
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    receipt_url = models.URLField(null=True, blank=True)

    def __str__(self):
        return f"{self.description} ({self.amount})"

class TeacherPayment(TenantModel):
    teacher = models.ForeignKey('school.Teacher', on_delete=models.CASCADE, related_name='payments')
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_sanctions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    month = models.IntegerField() # 1-12
    year = models.IntegerField()
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Paye {self.teacher} - {self.month}/{self.year} ({self.amount_paid})"
