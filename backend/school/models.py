from django.db import models

class SchoolYear(models.Model):
    year = models.CharField(max_length=20, unique=True) # e.g. "2024-2025"
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.year

class Class(models.Model):
    CATEGORY_CHOICES = (
        ('general', 'Enseignement Général'),
        ('technique', 'Enseignement Technique'),
    )
    name = models.CharField(max_length=50) # e.g. "6ème A"
    level = models.CharField(max_length=50) # e.g. "6ème"
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    tuition_template = models.ForeignKey('finance.TuitionTemplate', on_delete=models.SET_NULL, null=True, blank=True, related_name='classes')
    is_exam = models.BooleanField(default=False)
    max_size = models.IntegerField(default=40)
    school_year = models.ForeignKey(SchoolYear, on_delete=models.CASCADE, related_name='classes')

    def __str__(self):
        return f"{self.name} ({self.school_year})"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.tuition_template:
            self.tuition_template.sync_classes()

    @property
    def current_size(self):
        return self.students.filter(status='active').count()

class Student(models.Model):
    GENDER_CHOICES = (('M', 'Masculin'), ('F', 'Féminin'))
    STATUS_CHOICES = (
        ('active', 'Actif'),
        ('inactive', 'Inactif'),
        ('suspended', 'Suspendu'),
    )
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    matricule = models.CharField(max_length=20, unique=True)
    date_of_birth = models.DateField()
    place_of_birth = models.CharField(max_length=100, null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    address = models.TextField()
    parent_name = models.CharField(max_length=200)
    parent_phone = models.CharField(max_length=20)
    parent_email = models.EmailField(null=True, blank=True)
    enrollment_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_repeating = models.BooleanField(default=False)
    school_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='students')

    def __str__(self):
        return f"{self.last_name.upper()} {self.first_name} ({self.matricule})"

    @property
    def total_due(self):
        # If template exists, use it as priority
        if self.school_class.tuition_template:
            tpl = self.school_class.tuition_template
            base = tpl.registration_fee + tpl.tranche_1 + tpl.tranche_2 + tpl.tranche_3 + tpl.material_fee
        else:
            base = self.school_class.tranches.aggregate(models.Sum('amount'))['amount__sum'] or 0
        
        # Add exam fee if applicable
        if self.school_class.is_exam:
            from .models import SchoolConfiguration
            config = SchoolConfiguration.objects.first()
            if config:
                base += config.exam_fee_amount
                
        return base
    
    @property
    def total_paid(self):
        return self.payments.aggregate(models.Sum('amount_paid'))['amount_paid__sum'] or 0

class Subject(models.Model):
    name = models.CharField(max_length=100)
    coefficient = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.name} (Coef: {self.coefficient})"

class Period(models.Model):
    name = models.CharField(max_length=100) # e.g. "Premier Trimestre"
    start_date = models.DateField()
    end_date = models.DateField()
    school_year = models.ForeignKey(SchoolYear, on_delete=models.CASCADE, related_name='periods')

    def __str__(self):
        return f"{self.name} ({self.school_year})"

class Grade(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='grades')
    period = models.ForeignKey(Period, on_delete=models.CASCADE, related_name='grades')
    value = models.DecimalField(max_digits=5, decimal_places=2)
    max_value = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    date = models.DateField(auto_now_add=True)
    teacher = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, limit_choices_to={'role': 'professeur'})

    def __str__(self):
        return f"{self.student} - {self.subject}: {self.value}/{self.max_value}"

class SchoolConfiguration(models.Model):
    name = models.CharField(max_length=200, default='XSCHOOL Management')
    email = models.EmailField(default='contact@xschool.cm', blank=True, null=True)
    phone = models.CharField(max_length=50, default='+237 699 00 11 22', blank=True, null=True)
    address = models.TextField(default='Bastos, Yaoundé, Cameroun', blank=True, null=True)
    website = models.URLField(default='https://vanda-studio.tech', blank=True, null=True)
    slogan = models.CharField(max_length=200, default='EXCELLENCE & DISCIPLINE', blank=True, null=True)
    logo = models.ImageField(upload_to='school_logos/', null=True, blank=True)
    
    # Alert & Notification Settings
    enable_email_alerts = models.BooleanField(default=True)
    enable_sms_alerts = models.BooleanField(default=False)
    payment_reminder_days = models.IntegerField(default=3)
    low_grade_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)

    # Finance Settings
    currency_symbol = models.CharField(max_length=10, default='FCFA')
    currency_code = models.CharField(max_length=10, default='XAF')
    tranche_1_deadline = models.DateField(null=True, blank=True)
    tranche_2_deadline = models.DateField(null=True, blank=True)
    tranche_3_deadline = models.DateField(null=True, blank=True)
    exam_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=10000)
    enable_cash_payment = models.BooleanField(default=True)
    enable_mobile_payment = models.BooleanField(default=True)
    enable_bank_transfer = models.BooleanField(default=False)
    bank_details = models.TextField(blank=True, null=True)
    receipt_footer = models.TextField(blank=True, null=True)

    # Security Settings
    session_timeout = models.IntegerField(default=30)  # minutes
    min_password_length = models.IntegerField(default=8)
    max_login_attempts = models.IntegerField(default=5)
    require_strong_password = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(default=False)
    two_factor_enforcement = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Configuration de l'école"
        verbose_name_plural = "Configuration de l'école"
