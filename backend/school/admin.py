from django.contrib import admin
from .models import (
    SchoolYear, Class, Student, Subject, Period, Grade, 
    SchoolConfiguration, Teacher, SanctionType, TeacherSanction
)

@admin.register(SchoolYear)
class SchoolYearAdmin(admin.ModelAdmin):
    list_display = ('year', 'establishment', 'is_active')
    list_filter = ('establishment', 'is_active')
    search_fields = ('year',)

@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ('level', 'school_year', 'establishment', 'category', 'is_exam')
    list_filter = ('establishment', 'school_year', 'category', 'is_exam')
    search_fields = ('name', 'level')

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'matricule', 'school_class', 'establishment', 'status')
    list_filter = ('establishment', 'school_class', 'status', 'gender')
    search_fields = ('last_name', 'first_name', 'matricule')
    ordering = ('last_name', 'first_name')

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'establishment', 'coefficient')
    list_filter = ('establishment',)
    search_fields = ('name',)

@admin.register(Period)
class PeriodAdmin(admin.ModelAdmin):
    list_display = ('name', 'school_year', 'establishment', 'start_date', 'end_date')
    list_filter = ('establishment', 'school_year')
    search_fields = ('name',)

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'period', 'value', 'max_value', 'establishment')
    list_filter = ('establishment', 'period', 'subject')
    search_fields = ('student__last_name', 'student__first_name', 'subject__name')

@admin.register(SchoolConfiguration)
class SchoolConfigurationAdmin(admin.ModelAdmin):
    list_display = ('name', 'establishment', 'email', 'phone', 'city')
    search_fields = ('name', 'email')

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'matricule', 'establishment', 'is_active')
    list_filter = ('establishment', 'is_active')
    search_fields = ('last_name', 'first_name', 'matricule')

@admin.register(SanctionType)
class SanctionTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'establishment', 'default_amount')
    list_filter = ('establishment',)

@admin.register(TeacherSanction)
class TeacherSanctionAdmin(admin.ModelAdmin):
    list_display = ('teacher', 'sanction_type', 'amount', 'date', 'establishment', 'is_processed')
    list_filter = ('establishment', 'sanction_type', 'is_processed')
    search_fields = ('teacher__last_name', 'reason')
