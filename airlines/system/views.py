from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes

from .models import Users, Offices
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UsersSerializer, CustomTokenObtainPairSerializer, OfficesSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        attempts_key = f'login_attempts_{email}'
        lockout_key = f'lockout_{email}'

        attempts = cache.get(attempts_key, 0)
        lockout_time = cache.get(lockout_key)
        print(lockout_time)
        print(attempts)

        if lockout_time:
            return Response({"detail": "Слишком много попыток. Попробуйте позже"},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        if attempts >= 3:
            cache.set(lockout_key, True, 5)
            return Response({"detail": "Слишком много попыток. Попробуйте позже"},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        try:
            response = super().post(request, *args, **kwargs)
        except Exception as e:
            error_messages = e.detail.get('non_field_errors', [])
            return Response({"detail": error_messages}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if response.status_code == status.HTTP_200_OK:
            cache.delete(attempts_key)
            cache.delete(lockout_key)
            return response
        else:
            attempts += 1
            cache.set(attempts_key, attempts, timeout=3600)
            return Response({"detail": "Неправильный логин или пароль."}, status=status.HTTP_401_UNAUTHORIZED)


class UserViewSet(viewsets.ModelViewSet):
    queryset = Users.objects.all()
    serializer_class = UsersSerializer


class OfficeViewSet(viewsets.ModelViewSet):
    queryset = Offices.objects.all()
    serializer_class = OfficesSerializer


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UsersSerializer(user)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    user = request.user
    serializer = UsersSerializer(user)
    return Response(serializer.data)
