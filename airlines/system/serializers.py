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
        fields = '__all__'


class AircraftsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aircrafts
        fields = '__all__'


class SchedulesSerializer(serializers.ModelSerializer):
    business_price = serializers.SerializerMethodField()
    first_class_price = serializers.SerializerMethodField()

    class Meta:
        model = Schedules
        fields = '__all__'

    def get_business_price(self, obj):
        return float(obj.economy_price) * 1.35

    def get_first_class_price(self, obj):
        business_price = self.get_business_price(obj)
        return business_price * 1.30


class RoutesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Routes
        fields = '__all__'
