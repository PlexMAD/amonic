from django.core.management.base import BaseCommand
from system.models import Surveys0, Airports, CabinTypes
import csv

class Command(BaseCommand):
    help = 'Import survey data from CSV'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the CSV file')

    def handle(self, *args, **kwargs):
        file_path = kwargs['file_path']
        with open(file_path, newline='') as csvfile:
            reader = csv.reader(csvfile)
            next(reader)
            surveys = []
            for row in reader:
                departure_airport = Airports.objects.get(id=row[0]) if row[0].isdigit() else None
                arrival_airport = Airports.objects.get(id=row[1]) if row[1].isdigit() else None
                age = int(row[2]) if row[2].isdigit() else None
                gender = row[3] if row[3] else 'M'
                travel_class = CabinTypes.objects.get(id=row[4]) if row[4].isdigit() else None
                q1 = int(row[5]) if row[5].isdigit() else None
                q2 = int(row[6]) if row[6].isdigit() else None
                q3 = int(row[7]) if row[7].isdigit() else None
                q4 = int(row[8]) if row[8].isdigit() else None

                if departure_airport and arrival_airport and travel_class:
                    survey = Surveys0(
                        departure_airport=departure_airport,
                        arrival_airport=arrival_airport,
                        age=age,
                        gender=gender,
                        travel_class=travel_class,
                        q1=q1,
                        q2=q2,
                        q3=q3,
                        q4=q4,
                        survey_month='7'
                    )
                    surveys.append(survey)
            if surveys:
                Surveys0.objects.bulk_create(surveys)
            self.stdout.write(self.style.SUCCESS('Successfully imported surveys'))
