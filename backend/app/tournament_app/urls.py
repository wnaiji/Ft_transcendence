from django.urls import path
from .views import set_tournament, add_score

urlpatterns = [
    path("set/", set_tournament),
    path("score/add/", add_score),
]
