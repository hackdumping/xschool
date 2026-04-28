from django.contrib import admin
from .models import TuitionTemplate, TrancheConfig, Payment, Expense, TeacherPayment

@admin.register(TuitionTemplate)
class TuitionTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'establishment', 'registration_fee', 'tranche_1', 'tranche_2')
    list_filter = ('establishment', 'category')
    search_fields = ('name',)

@admin.register(TrancheConfig)
class TrancheConfigAdmin(admin.ModelAdmin):
    list_display = ('name', 'school_class', 'amount', 'due_date', 'establishment')
    list_filter = ('establishment', 'school_class')
    search_fields = ('name',)

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'student', 'tranche', 'amount_paid', 'date', 'mode', 'establishment')
    list_filter = ('establishment', 'mode', 'date')
    search_fields = ('receipt_number', 'student__last_name', 'student__first_name')
    date_hierarchy = 'date'

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'date', 'category', 'establishment')
    list_filter = ('establishment', 'category', 'date')
    search_fields = ('description', 'category')
    date_hierarchy = 'date'

@admin.register(TeacherPayment)
class TeacherPaymentAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'month', 'year', 'amount_paid', 'date', 'establishment')
    list_filter = ('establishment', 'year', 'month')
    search_fields = ('teacher__last_name', 'notes')
