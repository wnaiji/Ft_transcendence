from django.urls import include, path
from . import consumers

urlpatterns = [
    path('api/ws/', consumers.Consumer.as_asgi()),
]