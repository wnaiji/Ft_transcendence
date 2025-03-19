#!/bin/bash

until nc -z ganache 8545; do
  echo "Waiting for hardhat to be ready..."
  sleep 2
done

sleep 5

echo " ✅ Hardhat is ready!"

python manage.py check
python3 manage.py makemigrations
python3 manage.py migrate

# Reset all users' is_login to False (after migrations are applied)
python3 manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.all().update(is_login=False, leader=False, lock=False)
print('\033[32mAll users have reset is_login leader and lock to False\033[0m')

# Clear one_v_one and tournament fields for all users
for user in User.objects.all():
    user.one_v_one.clear()
    user.tournament.clear()
print('\033[32mAll users have cleared one_v_one and tournament fields \033[0m')
"

exec "$@"
