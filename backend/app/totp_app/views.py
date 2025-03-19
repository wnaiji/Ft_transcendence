import re
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.conf import settings
from accounts_app.serializers import UserMeSerializer

class VerifyTOTPAPIView(CreateAPIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request, *args, **kwargs):
		username = request.data.get("username")
		user = get_user_model().objects.get(username=username)

		otp = request.data.get("otp")
		regex = r'^\d{6}$'
		if not otp:
			return Response({"error": "OTP is required"}, status=status.HTTP_400_BAD_REQUEST)
		if not re.match(regex, otp):
			return Response({"error": "OTP must be a 6-digit number"}, status=status.HTTP_400_BAD_REQUEST)
		if not user.verify_totp(otp):
			return Response({"error": "OTP is invalid"}, status=status.HTTP_400_BAD_REQUEST)

		access_token = user.get_access_token()
		refresh_token = user.get_refresh_token()
		newresponse = Response(status=status.HTTP_204_NO_CONTENT)
		newresponse.set_cookie(
		    settings.AUTH_COOKIE_ACCESS,
		    access_token,
		    max_age=settings.AUTH_COOKIE_ACCESS_MAX_AGE,
		    path=settings.AUTH_COOKIE_PATH,
		    domain=settings.AUTH_COOKIE_DOMAIN,
		    secure=settings.AUTH_COOKIE_SECURE,
		    httponly=settings.AUTH_COOKIE_HTTP_ONLY,
		    samesite=settings.AUTH_COOKIE_SAMESITE,
		)
		newresponse.set_cookie(
		    settings.AUTH_COOKIE_REFRESH,
		    refresh_token,
		    max_age=settings.AUTH_COOKIE_REFRESH_MAX_AGE,
		    path=settings.AUTH_COOKIE_PATH,
		    domain=settings.AUTH_COOKIE_DOMAIN,
		    secure=settings.AUTH_COOKIE_SECURE,
		    httponly=settings.AUTH_COOKIE_HTTP_ONLY,
		    samesite=settings.AUTH_COOKIE_SAMESITE,
		)

		# serializer = UserMeSerializer(user)
		# newresponse.data = serializer.data
		user.totp_enabled = True
		user.is_anonymise = False
		user.save()
		return newresponse

class EnableTOTPAPIView(CreateAPIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		user = request.user
		otp = request.data.get("otp")
		if not otp:
			return Response({"error": "OTP is required"}, status=status.HTTP_400_BAD_REQUEST)

		if user.validate_totp(otp):
			request.user.totp_enabled = True
			user.enable_totp()
			return Response({"message": "TOTP enabled"}, status=status.HTTP_200_OK)
		else:
			return Response({"error": "OTP is invalid"}, status=status.HTTP_400_BAD_REQUEST)
