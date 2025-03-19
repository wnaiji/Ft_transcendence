# oauth_app/urls.py
from django.urls import path
from .views import RedirectTo42View, OAuthCallbackView

urlpatterns = [
    path('42/login/', RedirectTo42View.as_view(), name='ft_oauth_login'),
    path('42/callback/', OAuthCallbackView.as_view(), name='ft_oauth_callback'),
]
