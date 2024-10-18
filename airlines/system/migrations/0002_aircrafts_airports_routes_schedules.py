# Generated by Django 5.1.1 on 2024-10-16 22:35

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('system', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Aircrafts',
            fields=[
                ('id', models.AutoField(db_column='ID', primary_key=True, serialize=False)),
                ('name', models.TextField(db_column='Name')),
                ('make_model', models.TextField(db_column='MakeModel')),
                ('total_seats', models.IntegerField(db_column='TotalSeats')),
                ('economy_seats', models.IntegerField(db_column='EconomySeats')),
                ('business_seats', models.IntegerField(db_column='BusinessSeats')),
            ],
            options={
                'db_table': 'aircrafts',
            },
        ),
        migrations.CreateModel(
            name='Airports',
            fields=[
                ('id', models.AutoField(db_column='ID', primary_key=True, serialize=False)),
                ('iata_code', models.CharField(db_column='IATACode', max_length=3)),
                ('name', models.TextField(db_column='Name')),
                ('countryid', models.ForeignKey(db_column='CountryID', on_delete=django.db.models.deletion.DO_NOTHING, to='system.countries')),
            ],
            options={
                'db_table': 'airports',
            },
        ),
        migrations.CreateModel(
            name='Routes',
            fields=[
                ('id', models.AutoField(db_column='ID', primary_key=True, serialize=False)),
                ('distance', models.IntegerField(db_column='Distance')),
                ('flight_time', models.TimeField(db_column='FlightTime')),
                ('arrival_airport', models.ForeignKey(db_column='ArrivalAirportID', on_delete=django.db.models.deletion.DO_NOTHING, related_name='arrival_routes', to='system.airports')),
                ('departure_airport', models.ForeignKey(db_column='DepartureAirportID', on_delete=django.db.models.deletion.DO_NOTHING, related_name='departure_routes', to='system.airports')),
            ],
            options={
                'db_table': 'routes',
            },
        ),
        migrations.CreateModel(
            name='Schedules',
            fields=[
                ('id', models.AutoField(db_column='ID', primary_key=True, serialize=False)),
                ('date', models.DateField(db_column='Date')),
                ('time', models.TimeField(db_column='Time')),
                ('flight_number', models.CharField(db_column='FlightNumber', max_length=10)),
                ('economy_price', models.DecimalField(db_column='EconomyPrice', decimal_places=2, max_digits=10)),
                ('confirmed', models.BooleanField(db_column='Confirmed')),
                ('aircraft', models.ForeignKey(db_column='AircraftID', on_delete=django.db.models.deletion.DO_NOTHING, to='system.aircrafts')),
                ('route', models.ForeignKey(db_column='RouteID', on_delete=django.db.models.deletion.DO_NOTHING, to='system.routes')),
            ],
            options={
                'db_table': 'schedules',
            },
        ),
    ]