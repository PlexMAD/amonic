from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.auth.hashers import make_password, check_password


class Countries(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True, blank=True, )
    name = models.TextField(db_column='Name')

    class Meta:
        managed = False
        db_table = 'countries'


class Offices(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True, blank=True, )
    countryid = models.ForeignKey(Countries, models.DO_NOTHING, db_column='CountryID')
    title = models.TextField(db_column='Title')
    phone = models.TextField(db_column='Phone')
    contact = models.TextField(db_column='Contact')

    class Meta:
        managed = False
        db_table = 'offices'


class Roles(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True, blank=True, )
    title = models.TextField(db_column='Title')

    class Meta:
        managed = False
        db_table = 'roles'


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class Users(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(db_column='ID', primary_key=True, blank=True)
    roleid = models.ForeignKey('Roles', models.DO_NOTHING, db_column='RoleID')
    email = models.TextField(db_column='Email', unique=True)
    password = models.TextField(db_column='Password')
    firstname = models.TextField(db_column='FirstName', blank=True, null=True)
    lastname = models.TextField(db_column='LastName')
    officeid = models.ForeignKey('Offices', models.DO_NOTHING, db_column='OfficeID', blank=True, null=True)
    birthdate = models.DateField(db_column='Birthdate', blank=True, null=True)
    active = models.IntegerField(db_column='Active', blank=True, null=True)
    last_login = None
    is_superuser = None
    groups = None
    user_permissions = None

    @property
    def is_active(self):
        return self.active == 1

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        managed = False
        db_table = 'users'

    def __str__(self):
        return self.email


class UserSessionTracking(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE)
    login_time = models.DateTimeField(default=timezone.now)
    logout_time = models.DateTimeField(null=True, blank=True)
    duration = models.DurationField(null=True, blank=True)
    logout_reason = models.CharField(max_length=255, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.logout_time:
            self.duration = self.logout_time - self.login_time
        super(UserSessionTracking, self).save(*args, **kwargs)


class Airports(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True, blank=True)
    countryid = models.ForeignKey(Countries, models.DO_NOTHING, db_column='CountryID')
    iata_code = models.CharField(db_column='IATACode', max_length=3)
    name = models.TextField(db_column='Name')

    class Meta:
        db_table = 'airports'


class Routes(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True, blank=True)
    departure_airport = models.ForeignKey(Airports, models.DO_NOTHING, db_column='DepartureAirportID',
                                          related_name='departure_routes')
    arrival_airport = models.ForeignKey(Airports, models.DO_NOTHING, db_column='ArrivalAirportID',
                                        related_name='arrival_routes')
    distance = models.IntegerField(db_column='Distance')
    flight_time = models.TimeField(db_column='FlightTime')

    class Meta:
        db_table = 'routes'


class Aircrafts(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True, blank=True)
    name = models.TextField(db_column='Name')
    make_model = models.TextField(db_column='MakeModel')
    total_seats = models.IntegerField(db_column='TotalSeats')
    economy_seats = models.IntegerField(db_column='EconomySeats')
    business_seats = models.IntegerField(db_column='BusinessSeats')

    class Meta:
        db_table = 'aircrafts'


class Schedules(models.Model):
    id = models.AutoField(db_column='ID', primary_key=True, blank=True)
    date = models.DateField(db_column='Date')
    time = models.TimeField(db_column='Time')
    aircraft = models.ForeignKey(Aircrafts, models.DO_NOTHING, db_column='AircraftID')
    route = models.ForeignKey(Routes, models.DO_NOTHING, db_column='RouteID')
    flight_number = models.CharField(db_column='FlightNumber', max_length=10)
    economy_price = models.DecimalField(db_column='EconomyPrice', max_digits=10, decimal_places=2)
    confirmed = models.BooleanField(db_column='Confirmed')

    class Meta:
        db_table = 'schedules'
