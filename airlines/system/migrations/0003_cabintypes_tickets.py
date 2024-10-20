# Generated by Django 5.1.1 on 2024-10-19 10:49

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('system', '0002_aircrafts_airports_routes_schedules'),
    ]

    operations = [
        migrations.CreateModel(
            name='CabinTypes',
            fields=[
                ('id', models.AutoField(db_column='ID', primary_key=True, serialize=False)),
                ('name', models.TextField(db_column='Name')),
            ],
            options={
                'db_table': 'cabin_types',
            },
        ),
        migrations.CreateModel(
            name='Tickets',
            fields=[
                ('id', models.AutoField(db_column='ID', primary_key=True, serialize=False)),
                ('first_name', models.TextField(db_column='FirstName')),
                ('last_name', models.TextField(db_column='LastName')),
                ('email', models.TextField(db_column='Email')),
                ('phone', models.TextField(db_column='Phone')),
                ('passport_number', models.TextField(db_column='PassportNumber')),
                ('booking_reference', models.TextField(db_column='BookingReference')),
                ('confirmed', models.BooleanField(db_column='Confirmed')),
                ('cabintypeid', models.ForeignKey(db_column='CabinTypeID', on_delete=django.db.models.deletion.DO_NOTHING, to='system.cabintypes')),
                ('passport_country', models.ForeignKey(db_column='PassportCountryID', on_delete=django.db.models.deletion.DO_NOTHING, to='system.countries')),
                ('scheduleid', models.ForeignKey(db_column='ScheduleID', on_delete=django.db.models.deletion.DO_NOTHING, to='system.schedules')),
                ('userid', models.ForeignKey(db_column='UserID', on_delete=django.db.models.deletion.DO_NOTHING, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'tickets',
            },
        ),
    ]
