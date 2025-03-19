#!/bin/bash

set -eu

sed -i "s|server_name insert_here;|server_name $NGINX_HOST;|" /etc/nginx/nginx.conf

exec "$@"