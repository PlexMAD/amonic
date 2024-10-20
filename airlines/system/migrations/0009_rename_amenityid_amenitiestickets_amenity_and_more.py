# Generated by Django 5.1.1 on 2024-10-21 17:20

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('system', '0008_delete_amenitiescabintype'),
    ]

    operations = [
        migrations.RenameField(
            model_name='amenitiestickets',
            old_name='amenityid',
            new_name='amenity',
        ),
        migrations.RenameField(
            model_name='amenitiestickets',
            old_name='ticketid',
            new_name='ticket',
        ),
        migrations.CreateModel(
            name='AmenitiesCabinType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amenity', models.ForeignKey(db_column='AmenityID', on_delete=django.db.models.deletion.DO_NOTHING, to='system.amenities')),
                ('cabin_type', models.ForeignKey(db_column='CabinTypeID', on_delete=django.db.models.deletion.DO_NOTHING, to='system.cabintypes')),
            ],
            options={
                'db_table': 'amenities_cabin_types',
            },
        ),
        migrations.AddField(
            model_name='amenities',
            name='cabin_types',
            field=models.ManyToManyField(related_name='amenities', through='system.AmenitiesCabinType', to='system.cabintypes'),
        ),
    ]
