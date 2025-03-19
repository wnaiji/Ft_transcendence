#!/bin/bash
set -u

docker compose run backend bash -c "
  python3 manage.py makemigrations && \
  python3 manage.py migrate
"

# if [ $? -ne 0 ]; then
#     sudo docker compose run backend bash -c "
#     python3 manage.py makemigrations && \
#     python3 manage.py migrate
#     "
# fi
