import random
import string
import uuid
from datetime import timedelta, datetime

from django.contrib.auth import get_user_model
from django.contrib.auth import logout
from django.contrib.auth.hashers import make_password
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Offices, Roles, Airports, Routes, Schedules, Aircrafts, Tickets, Countries, Surveys0, Amenities, \
    AmenitiesTickets
from .serializers import UsersSerializer, OfficesSerializer, UserSessionTrackingSerializer, RoutesSerializer, \
    AirportsSerializer, SchedulesSerializer, AircraftsSerializer, TicketsSerializer, CountriesSerializer, \
    TicketCreateSerializer, Surveys0Serializer, AmenitiesSerializer, AmenitiesTicketsSerializer

User = get_user_model()

from django.utils import timezone
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Users, UserSessionTracking
from .serializers import CustomTokenObtainPairSerializer


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
            cache.set(lockout_key, True, 5 * 60)
            return Response({"detail": "Слишком много попыток. Попробуйте позже"},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == status.HTTP_200_OK:
                user = User.objects.get(email=email)
                last_session = UserSessionTracking.objects.filter(user=user, logout_time__isnull=True).last()

                if last_session:
                    last_session.logout_reason = 'Токен устарел'
                    last_session.save()
                    UserSessionTracking.objects.create(user=user, login_time=timezone.now())
                else:
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


class CountriesViewSet(viewsets.ModelViewSet):
    queryset = Countries.objects.all()
    serializer_class = CountriesSerializer


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


class UserSessionTrackingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSessionTrackingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserSessionTracking.objects.filter(user=self.request.user).order_by('-login_time')


class AirportsViewSet(viewsets.ModelViewSet):
    queryset = Airports.objects.all()
    serializer_class = AirportsSerializer


class AicraftsViewSet(viewsets.ModelViewSet):
    queryset = Aircrafts.objects.all()
    serializer_class = AircraftsSerializer


class RoutesViewSet(viewsets.ModelViewSet):
    queryset = Routes.objects.all()
    serializer_class = RoutesSerializer


class SchedulesViewSet(viewsets.ModelViewSet):
    queryset = Schedules.objects.all()
    serializer_class = SchedulesSerializer

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        departure_airport = request.query_params.get('departure_airport')
        arrival_airport = request.query_params.get('arrival_airport')
        date = request.query_params.get('date')
        include_nearby_days = request.query_params.get('include_nearby_days', 'false').lower() == 'true'

        if not (departure_airport and arrival_airport and date):
            return Response(
                {"detail": "Нужно указать все параметры поиска (аэропорт вылета, аэропорт прибытия и дату)."},
                status=status.HTTP_400_BAD_REQUEST)

        try:
            selected_date = datetime.strptime(date, '%Y-%m-%d').date()
        except ValueError:
            return Response({"detail": "Неверный формат даты. Используйте формат ГГГГ-ММ-ДД."},
                            status=status.HTTP_400_BAD_REQUEST)

        if include_nearby_days:
            start_date = selected_date - timedelta(days=3)
            end_date = selected_date + timedelta(days=3)
            schedules = self.queryset.filter(
                Q(route__departure_airport=departure_airport) &
                Q(route__arrival_airport=arrival_airport) &
                Q(date__range=(start_date, end_date))
            )
        else:
            schedules = self.queryset.filter(
                Q(route__departure_airport=departure_airport) &
                Q(route__arrival_airport=arrival_airport) &
                Q(date=selected_date)
            )

        if schedules.exists():
            serializer = self.get_serializer(schedules, many=True)
            return Response(serializer.data)
        else:
            return Response({"detail": "Нет доступных рейсов на указанную дату."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='search-by-id')
    def search_by_id(self, request):
        schedule_id = request.query_params.get('id')

        if not schedule_id:
            return Response({"detail": "Необходимо указать id расписания."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            schedule = self.queryset.get(id=schedule_id)
        except Schedules.DoesNotExist:
            return Response({"detail": "Расписание с таким id не найдено."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(schedule)
        return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_schedule(request, schedule_id):
    try:
        flight = Schedules.objects.get(pk=schedule_id)
    except Schedules.DoesNotExist:
        return Response({'error': 'Flight not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = SchedulesSerializer(flight, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Tickets.objects.all()
    serializer_class = TicketsSerializer

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        booking_reference = request.query_params.get('booking_reference', None)
        print(booking_reference)
        if booking_reference is not None:
            tickets = self.queryset.filter(booking_reference=booking_reference)
            serializer = self.get_serializer(tickets, many=True)
            return Response(serializer.data)
        return Response({"detail": "Please provide a booking reference."}, status=400)


class TicketCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def generate_booking_reference(self, length=6):
        characters = string.ascii_letters + string.digits
        return ''.join(random.choice(characters) for _ in range(length))

    def post(self, request):
        passengers_data = request.data.get('passengers', [])
        has_return_trip = request.data.get('has_return_trip', False)
        tickets = []

        # Проверка на наличие пассажиров
        if not passengers_data:
            return Response({"error": "Пассажиры не указаны."}, status=status.HTTP_400_BAD_REQUEST)

        # Создание билетов на рейс туда и обратно
        for passenger in passengers_data:
            country_name = passenger.get('passport_country')
            country = Countries.objects.filter(name=country_name).first()

            if not country:
                return Response({"error": f"Country '{country_name}' not found."}, status=status.HTTP_400_BAD_REQUEST)

            # Генерация уникального номера бронирования для каждого пассажира
            booking_reference = self.generate_booking_reference()

            # Создаем билет на рейс туда
            outbound_serializer = TicketCreateSerializer(data={
                **passenger,
                'booking_reference': booking_reference,
                'scheduleid': request.data.get('flight'),
                'cabintypeid': request.data.get('cabintypeid'),
                'confirmed': True,
                'passport_country': country.id,
            }, context={'request': request})

            if outbound_serializer.is_valid():
                outbound_ticket = outbound_serializer.save()
                tickets.append(outbound_ticket)
            else:
                return Response(outbound_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            # Если есть обратный рейс, создаем билет на обратный рейс
            if has_return_trip:
                return_serializer = TicketCreateSerializer(data={
                    **passenger,
                    'booking_reference': booking_reference,  # Один общий номер для обратного рейса
                    'scheduleid': request.data.get('returnFlight'),
                    'cabintypeid': request.data.get('cabintypeid'),
                    'confirmed': True,
                    'passport_country': country.id,
                }, context={'request': request})

                if return_serializer.is_valid():
                    return_ticket = return_serializer.save()
                    tickets.append(return_ticket)
                else:
                    return Response(return_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Возвращаем идентификаторы билетов
        return Response({
            'tickets': [ticket.id for ticket in tickets],
            'booking_numbers': [self.generate_booking_reference() for _ in tickets],
            # Уникальные номера для каждого пассажира
        }, status=status.HTTP_201_CREATED)


class Surveys0ViewSet(viewsets.ModelViewSet):
    queryset = Surveys0.objects.all()
    serializer_class = Surveys0Serializer


class AmenitiesViewSet(viewsets.ModelViewSet):
    queryset = Amenities.objects.all()
    serializer_class = AmenitiesSerializer


class AmenitiesTicketsViewSet(viewsets.ModelViewSet):
    queryset = AmenitiesTickets.objects.all()
    serializer_class = AmenitiesTicketsSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ticket']

    def get_queryset(self):
        queryset = super().get_queryset()
        ticket_id = self.request.query_params.get('ticket', None)
        if ticket_id is not None:
            queryset = queryset.filter(ticket_id=ticket_id)
        return queryset