FROM    python:3.12-bookworm

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

RUN set -eux; \
    # groupadd --system --gid 1342 djangogroup; \
    # useradd --system --gid djangogroup --no-create-home --home /nonexistent --comment "django user" --shell /bin/false --uid 1342 djangouser; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        curl \
        -y netcat-openbsd \
    ; \
    rm -rf /var/lib/apt/lists/*;

COPY    ./requirements.txt /

RUN mkdir -p /app/media /var/www /var/www/media

RUN set -eux; \
    # pip install --upgrade pip; \
    pip install --no-cache-dir -r requirements.txt;

COPY entrypoint.sh /entrypoint.sh

WORKDIR /app

# RUN set -eux; \
#     chown -R djangouser:djangogroup /app;
# USER    djangouser

EXPOSE  8000

ENTRYPOINT ["/entrypoint.sh"]

# CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "transcendence_backend.asgi:application"]
