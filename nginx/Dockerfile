FROM    nginx:1.27.3

RUN set -eux; \
    mkdir -p /etc/nginx/ssl/transcendence

COPY    conf/.ssl_transcendence/* /etc/nginx/ssl/transcendence/

COPY    conf/nginx.conf /etc/nginx/nginx.conf

COPY    tools/script.sh /

RUN     chmod +x /script.sh

EXPOSE 8443

ENTRYPOINT	["/script.sh"]

CMD ["nginx", "-g", "daemon off;"]