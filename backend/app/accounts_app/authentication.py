#https://github.com/jazzband/djangorestframework-simplejwt/blob/master/rest_framework_simplejwt/authentication.py
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication

# W added
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken


class CustomJWTAuthentication(JWTAuthentication):
     def authenticate(self, request):
        raw_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)

        return self.get_user(validated_token), validated_token
