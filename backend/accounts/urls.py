from django.urls import path
from .views import SignUpView, PasswordResetView

urlpatterns = [
    path('register/', SignUpView.as_view(), name='register'),
    path('password-reset/', PasswordResetView.as_view(), name='password_reset'),
]
