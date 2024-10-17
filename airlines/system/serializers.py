from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import Users, Offices, UserSessionTracking, Schedules, Aircrafts, Airports, Routes
from django.core.cache import cache
from rest_framework import status
from rest_framework import serializers
from .models import Users, Offices


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs['email']
        cache_key = f"login_attempts_{email}"
        attempts = cache.get(cache_key, 0)

        if attempts >= 3:
            raise serializers.ValidationError('Повторите позже.')

        try:
            user = Users.objects.get(email=email)

            if not user.is_active:
                raise serializers.ValidationError('Пользователь заблокирован.')

            if not user.check_password(attrs['password']):
                attempts += 1
                cache.set(cache_key, attempts, timeout=10)
                raise serializers.ValidationError('Неверный пароль.')

            cache.delete(cache_key)
            return super().validate(attrs)

        except Users.DoesNotExist:
            attempts += 1
            cache.set(cache_key, attempts, timeout=10)
            raise serializers.ValidationError('Неверный логин.')


class UsersSerializer(serializers.ModelSerializer):
    office_name = serializers.CharField(source='officeid.title', read_only=True)

    class Meta:
        model = Users
        fields = ['id', 'firstname', 'lastname', 'email', 'birthdate', 'roleid', 'office_name', 'active']


class OfficesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offices
        fields = '__all__'


class UserSessionTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSessionTracking
        fields = ['login_time', 'logout_time', 'duration', 'logout_reason']


class AirportsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airports
        fields = ['id', 'name', 'iatacode']


class AircraftsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aircrafts
        fields = ['id', 'name', 'makemodel']


class SchedulesSerializer(serializers.ModelSerializer):
    from_airport = AirportsSerializer(source='route.departure_airport', read_only=True)
    to_airport = AirportsSerializer(source='route.arrival_airport', read_only=True)
    aircraft = AircraftsSerializer(read_only=True)

    class Meta:
        model = Schedules
        fields = [
            'id', 'date', 'time', 'flight_number', 'economy_price',
            'business_price', 'first_class_price', 'confirmed', 'from_airport',
            'to_airport', 'aircraft'
        ]


class RoutesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Routes
        fields = '__all__'
