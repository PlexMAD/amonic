# Generated by Django 5.1.1 on 2024-10-21 13:00

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('system', '0004_surveys0'),
    ]

    operations = [
        migrations.CreateModel(
            name='Amenities',
            fields=[
                ('id', models.AutoField(db_column='ID', primary_key=True, serialize=False)),
                ('service', models.TextField(db_column='Service')),
                ('price', models.DecimalField(db_column='Price', decimal_places=2, max_digits=10)),
            ],
            options={
                'db_table': 'amenities',
            },
        ),
        migrations.CreateModel(
            name='AmenitiesTickets',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('price', models.DecimalField(db_column='Price', decimal_places=2, max_digits=10)),
                ('amenityid', models.ForeignKey(db_column='AmenityID', on_delete=django.db.models.deletion.DO_NOTHING, to='system.amenities')),
                ('ticketid', models.ForeignKey(db_column='TicketID', on_delete=django.db.models.deletion.DO_NOTHING, to='system.tickets')),
            ],
            options={
                'db_table': 'amenities_tickets',
            },
        ),
    ]
