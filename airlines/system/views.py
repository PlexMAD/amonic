from django.contrib.auth.hashers import make_password
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes

from .models import Users, Offices, Roles
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
from django.contrib.auth import login, logout
from django.shortcuts import redirect
from django.utils import timezone
from .models import UserSessionTracking
User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        attempts_key = f'login_attempts_{email}'
        lockout_key = f'lockout_{email}'

        attempts = cache.get(attempts_key, 0)
        lockout_time = cache.get(lockout_key)

        if lockout_time:
            return Response({"detail": "Слишком много попыток. Попробуйте позже"},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        if attempts >= 3:
            cache.set(lockout_key, True, 5)
            return Response({"detail": "Слишком много попыток. Попробуйте позже"},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == status.HTTP_200_OK:
                user = User.objects.get(email=email)
                UserSessionTracking.objects.create(user=user, login_time=timezone.now())
                cache.delete(attempts_key)
                cache.delete(lockout_key)
            return response
        except Exception as e:
            error_messages = e.detail.get('non_field_errors', [])
            return Response({"detail": error_messages}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_user(request):
    print(request.data)
    if request.user.roleid.id != 1:
        return Response({'error': 'Вы не администратор'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    try:
        office_name = data.get('office_name')
        office = Offices.objects.get(title=office_name)
        role = Roles.objects.get(id=2)
        user = User.objects.create(
            email=data['email'],
            roleid=role,
            firstname=data['firstname'],
            lastname=data['lastname'],
            officeid=office,
            birthdate=data['birthdate'],
            password=make_password(data['password']),
            active=1
        )
        user.save()
        return Response({'message': 'Пользователь успешно добавлен'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user(request, user_id):
    print(request.data)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        data = request.data
        try:
            user.email = data.get('email', user.email)
            user.firstname = data.get('firstname', user.firstname)
            user.lastname = data.get('lastname', user.lastname)
            user.active = data.get('active', user.active)
            if 'office_name' in data:
                office = Offices.objects.get(title=data['office_name'])
                user.officeid = office

            if 'roleid' in data:
                role = Roles.objects.get(id=data['roleid'])
                user.roleid = role

            user.save()
            return Response({'message': 'Пользователь успешно обновлен'}, status=status.HTTP_200_OK)

        except Offices.DoesNotExist:
            return Response({'error': 'Офис не найден'}, status=status.HTTP_400_BAD_REQUEST)
        except Roles.DoesNotExist:
            return Response({'error': 'Роль не найдена'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(e)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        session = UserSessionTracking.objects.filter(user=request.user, logout_time__isnull=True).last()
        if session:
            session.logout_time = timezone.now()
            session.save()
        logout(request)
        return Response({'message': 'Выход выполнен успешно'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Произошла ошибка при выходе'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def test_error(request):
    raise ValueError("Искусственная ошибка для тестирования")