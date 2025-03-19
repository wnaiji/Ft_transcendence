#!/bin/bash
# https://stackoverflow.com/questions/6244382/how-to-automate-createsuperuser-on-django

set -u

create_superuser() {
  local USERNAME="$1"
  local EMAIL="$2"
  local PASSWORD="$3"

  docker compose run backend bash -c "
  python3 manage.py shell -c \"
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$USERNAME').exists():
    User.objects.create_superuser('$USERNAME','$EMAIL', True, '$PASSWORD')
    print('\\033[32m ✅ Superuser created as $USERNAME\\033[0m')
else:
    print('\\033[32mSuperuser already exists as $USERNAME\\033[0m')
\"
  "

  if [ $? -ne 0 ]; then
    sudo docker compose run backend bash -c "
    python3 manage.py shell -c \"
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$USERNAME').exists():
    User.objects.create_superuser('$USERNAME', '$EMAIL', True, '$PASSWORD')
    print('\\033[32mSuperuser created as $USERNAME\\033[0m')
else:
    print('\\033[32mSuperuser already exists as $USERNAME\\033[0m')
\"
    "
  fi
}

create_superuser "root" "root@root.com" "Testtest06*"
create_superuser "test" "test@test.com" "Testtest06*"
create_superuser "test1" "test2@test.com" "Testtest06*"
create_superuser "test2" "test3@test.com" "Testtest06*"
