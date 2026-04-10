from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

from accounts.views import UserViewSet, SignUpView, PasswordResetView, LoginView, NotificationViewSet, InitAdminView
from school.views import (
    SchoolYearViewSet, ClassViewSet, StudentViewSet,
    SubjectViewSet, PeriodViewSet, GradeViewSet,
    SchoolConfigurationViewSet
)
from finance.views import (
    TrancheConfigViewSet, PaymentViewSet, ExpenseViewSet, TuitionTemplateViewSet
)
from agenda.views import CalendarEventViewSet
from core.views import DashboardStatsView, MigrationView

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'school-years', SchoolYearViewSet)
router.register(r'classes', ClassViewSet)
router.register(r'students', StudentViewSet)
router.register(r'subjects', SubjectViewSet)
router.register(r'periods', PeriodViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'tranches', TrancheConfigViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'tuition-templates', TuitionTemplateViewSet)
router.register(r'events', CalendarEventViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'school', SchoolConfigurationViewSet, basename='school')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('api/register/', SignUpView.as_view(), name='register'),
    path('api/password-reset/', PasswordResetView.as_view(), name='password_reset'),
    path('api/migrate/', MigrationView.as_view(), name='migrate'),
    path('api/init-admin/', InitAdminView.as_view(), name='init_admin'),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
