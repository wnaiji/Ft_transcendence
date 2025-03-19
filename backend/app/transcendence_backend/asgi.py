"""
ASGI config for transcendence_backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

# Y added
# import django
# django.setup()

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence_backend.settings')

# Y added
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
# from channels.auth import AuthMiddlewareStack
# from channels.auth import AuthMiddlewareStack, useless in jwt ?
from websocket_app.middleware import JWTAuthMiddlewareStack

django_asgi_app = get_asgi_application()
# from backend.app.websocket_app.urls_ws import urlpatterns # This will hold the websocket routes
import websocket_app.urls

#application = get_asgi_application()
# Y changed
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    # add AllowedHostsOriginValidator ?
    # remove AuthMiddlewareStack ?
    "websocket": AllowedHostsOriginValidator(JWTAuthMiddlewareStack(URLRouter(websocket_app.urls.urlpatterns))),
})
