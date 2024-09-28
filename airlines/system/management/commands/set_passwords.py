from system.models import Users
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def handle(self, *args, **options):

        users = Users.objects.all()

        for user in users:
            if not user.password.startswith('pbkdf2_'):
                user.password = make_password(user.password)
                user.save(update_fields=['password'])

        print(f"Пароли для {users.count()} пользователей проверены и зашифрованы, если это требовалось.")

