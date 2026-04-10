from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from .models import SchoolConfiguration

class SchoolSecurityMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # 1. Maintenance Mode Enforcement
        try:
            config = SchoolConfiguration.objects.first()
            if config and config.maintenance_mode:
                # Allow admins and login/settings/me paths (to enable maintenance)
                user = request.user
                is_admin = user.is_authenticated and getattr(user, 'role', None) == 'admin'
                exempt_paths = [
                    '/api/token/', 
                    '/api/token/refresh/', 
                    '/api/school/settings/',
                    '/api/users/me/'
                ]
                
                if not is_admin and request.path not in exempt_paths and request.path.startswith('/api/'):
                    return JsonResponse({
                        "error": "Site en maintenance",
                        "message": "Le système est actuellement en cours de maintenance. Veuillez réessayer plus tard."
                    }, status=503)
        except Exception:
            pass

        # 2. Dynamic Session Timeout
        if request.user.is_authenticated:
            try:
                if config:
                    # session_timeout is in minutes, set_expiry expects seconds
                    request.session.set_expiry(config.session_timeout * 60)
            except Exception:
                pass
        
        return None
