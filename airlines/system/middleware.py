# middleware.py
from django.utils import timezone
from .models import UserSessionTracking


class UserSessionTrackingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        if request.user.is_authenticated:
            session = UserSessionTracking.objects.filter(user=request.user, logout_time__isnull=True).last()
            if session:
                session.logout_time = timezone.now()
                session.logout_reason = f'Error occurred: {str(exception)}'
                session.save()
