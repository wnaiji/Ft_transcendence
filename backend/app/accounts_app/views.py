#W added
import qrcode
import base64
import re
import os
import csv
import io
from io import BytesIO
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.views import APIView
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.generics import RetrieveAPIView, ListAPIView, CreateAPIView
from .serializers import UserSerializer, UserMeSerializer, SignupSerializer
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.parsers import MultiPartParser, FormParser
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):

        password = request.data.get('password')
        regex = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$'
        if not password:
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not re.match(regex, password):
            return Response({"error": "Password must contain at least 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character"}, status=status.HTTP_400_BAD_REQUEST)
      
        username = request.data.get('username')
        regex = r'^[a-zA-Z0-9_]{1,50}$'
        if not username:
            return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not re.match(regex, username):
            return Response({"error": "Username must contain only letters, numbers and underscores"}, status=status.HTTP_400_BAD_REQUEST)
      
        otp_temp = request.data.get('otp')
        if 'otp' in request.data:
          del request.data['otp']
        original_response = super().post(request, *args, **kwargs)
        if original_response.status_code == 200:
            user = get_user_model().objects.get(username=username)
            otp = otp_temp
            refresh_token = original_response.data.get(settings.AUTH_COOKIE_REFRESH)
            access_token = original_response.data.get(settings.AUTH_COOKIE_ACCESS)
            
            # ajouter un check self.scope["user"].is_login soit self.channel_layer.group_add
            
            if (user.is_login == True):
                return Response(status=status.HTTP_403_FORBIDDEN)
            user.set_access_token(access_token)
            user.set_refresh_token(refresh_token)
            user.save()

            response = Response()

            if not user.totp_enabled:
                user.generate_totp_secret()
       
                totp_uri = f"{user.get_totp_uri()}"
                qr_code = qrcode.make(totp_uri)
                buffered = BytesIO()
                qr_code.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()

                user.save()
                response.data = {"img": img_str}
                response.status_code = status.HTTP_200_OK
                return response
            else:
                regex = r'^\d{6}$'
                if not otp:
                    return Response({"error": "OTP is required"}, status=status.HTTP_400_BAD_REQUEST)
                if not re.match(regex, otp):
                    return Response({"error": "OTP must be a 6-digit number"}, status=status.HTTP_400_BAD_REQUEST)
                if not user.verify_totp(otp):
                    return Response({"error": "OTP is invalid"}, status=status.HTTP_400_BAD_REQUEST)
        
            response = Response(status=status.HTTP_204_NO_CONTENT)
            response.set_cookie(
                settings.AUTH_COOKIE_REFRESH,
                refresh_token,
                max_age=settings.AUTH_COOKIE_REFRESH_MAX_AGE,
                path=settings.AUTH_COOKIE_PATH,
                domain=settings.AUTH_COOKIE_DOMAIN,
                secure=settings.AUTH_COOKIE_SECURE,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                samesite=settings.AUTH_COOKIE_SAMESITE,
            )
            response.set_cookie(
                settings.AUTH_COOKIE_ACCESS,
                access_token,
                max_age=settings.AUTH_COOKIE_ACCESS_MAX_AGE,
                path=settings.AUTH_COOKIE_PATH,
                domain=settings.AUTH_COOKIE_DOMAIN,
                secure=settings.AUTH_COOKIE_SECURE,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                samesite=settings.AUTH_COOKIE_SAMESITE,
            )
            user.is_anonymise = False
            user.save()
            return response
        return original_response

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)

        if not refresh_token:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        request.data[settings.AUTH_COOKIE_REFRESH] = refresh_token

        original_response = super().post(request, *args, **kwargs)

        if original_response.status_code == 200:
            access_token = original_response.data.get(settings.AUTH_COOKIE_ACCESS)

            response = Response(status=status.HTTP_204_NO_CONTENT)

            response.set_cookie(
                settings.AUTH_COOKIE_ACCESS,
                access_token,
                max_age=settings.AUTH_COOKIE_ACCESS_MAX_AGE,
                path=settings.AUTH_COOKIE_PATH,
                domain=settings.AUTH_COOKIE_DOMAIN,
                secure=settings.AUTH_COOKIE_SECURE,
                httponly=settings.AUTH_COOKIE_HTTP_ONLY,
                samesite=settings.AUTH_COOKIE_SAMESITE,
            )
            return response

        return original_response

class CustomTokenVerifyView(TokenVerifyView):
    def post(self, request, *args, **kwargs):
        access_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)

        if access_token:
            request.data['token'] = access_token

        original_response = super().post(request, *args, **kwargs)
        if original_response.status_code == 200:
            return Response(status=status.HTTP_204_NO_CONTENT)

        return original_response

# UsersListAPIView retrieve all users except ourself
class UsersListAPIView(ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):# tosee
        user = self.request.user
        return get_user_model().objects.exclude(id=user.id).exclude(is_anonymise=True).order_by('id')

class UserMeRetrieveAPIView(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserMeSerializer

    def get_object(self):
        return self.request.user

class UserAvatarAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        access_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)

        decoded_data_access_token = AccessToken(access_token)
        user_id = decoded_data_access_token.payload.get("user_id")
        user = get_user_model().objects.get(id=user_id)

        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Empty file'},
                status=status.HTTP_400_BAD_REQUEST
            )

        avatar = request.FILES['avatar']
        if avatar.size > 2 * 1024 * 1024:
            return Response(
                {'error': 'File size exceeds 2 MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user.avatar:
            if os.path.isfile(user.avatar.path):
                os.remove(user.avatar.path)

        user.avatar = avatar
        try:
            user.full_clean()
            user.save()
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
            "ALL",
            {
                "type": "redirect_receive",
                "data": {
                    "key": "UPDATE",
                    "id": user.id,
                },
            }
            )
            return Response(
                 {'avatar_url': user.avatar.url},
                 status=status.HTTP_200_OK
            )
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, *arg, **kwargs):
        access_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)

        decoded_data_access_token = AccessToken(access_token)
        user_id = decoded_data_access_token.payload.get("user_id")
        user = get_user_model().objects.get(id=user_id)

        if not user.avatar or not user.avatar.name:
            return Response(
                {'error': 'No avatar to delete'},
                status=status.HTTP_400_BAD_REQUEST
            )

        avatar_path = user.avatar.path
        if os.path.isfile(avatar_path):
            os.remove(avatar_path)

        user.avatar = None
        user.save()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "ALL",
            {
                "type": "redirect_receive",
                "data": {
                    "key": "UPDATE",
                    "id": user.id,
                },
            }
        )

        return Response(
            {'message': 'Avatar successfully deleted'},
            status=status.HTTP_200_OK
        )

    def get(self, request, *arg, **kwargs):
        access_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)

        decoded_data_access_token = AccessToken(access_token)
        user_id = decoded_data_access_token.payload.get("user_id")
        user = get_user_model().objects.get(id=user_id)

        if not user.avatar or not user.avatar.name:
            return Response(
                {'message': 'No avatar available'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {'avatar_url': user.avatar.url},
            status=status.HTTP_200_OK
        )

class UserRetrieveAPIView(RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        try:
            User = get_user_model()
            user_id = self.kwargs.get('id')

            user = User.objects.filter(id=user_id).exclude(is_anonymise=True).first()
            if not user:
                raise NotFound("404: ID NOT FOUND")

            return user

        except Exception as e:  # Catch all unexpected exceptions
            print(f"Error in get_object: {e}")  # Debugging log
            raise NotFound("An unexpected error occurred while retrieving the user.")

class SignupCreateAPIView(CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SignupSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = request.data.get('email')
        regex = r'^(?=.{1,100}$)[^\s@]+@[^\s@]+.[^\s@]+$'
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not re.match(regex, email):
            return Response({"error": "Email is invalid"}, status=status.HTTP_400_BAD_REQUEST)

        password = request.data.get('password')
        regex = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$'
        if not password:
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not re.match(regex, password):
            return Response({"error": "Password must contain at least 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character"}, status=status.HTTP_400_BAD_REQUEST)

        username = request.data.get('username')
        regex = r'^[a-zA-Z0-9_]{1,50}$'
        if not username:
            return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not re.match(regex, username):
            return Response({"error": "Username must contain only letters, numbers and underscores"}, status=status.HTTP_400_BAD_REQUEST)

        self.perform_create(serializer)

        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie('access')
        response.delete_cookie('refresh')
        return response

#SIGNOUT
class SignoutCreateAPIView(CreateAPIView):
    def post(self, request):
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # https://github.com/django/django/blob/main/django/http/response.py
        # delete cookie not good for secure flag so reimplement direct
        response.set_cookie(
            key=settings.AUTH_COOKIE_ACCESS,
            value='',
            max_age=0,
            expires='Thu, 01 Jan 1970 00:00:00 GMT',
            path=settings.AUTH_COOKIE_PATH,
            domain=settings.AUTH_COOKIE_DOMAIN,
            secure=settings.AUTH_COOKIE_SECURE,
            httponly=settings.AUTH_COOKIE_HTTP_ONLY,
            samesite=settings.AUTH_COOKIE_SAMESITE,
        )
        response.set_cookie(
            key=settings.AUTH_COOKIE_REFRESH,
            value='',
            max_age=0,
            expires='Thu, 01 Jan 1970 00:00:00 GMT',
            path=settings.AUTH_COOKIE_PATH,
            domain=settings.AUTH_COOKIE_DOMAIN,
            secure=settings.AUTH_COOKIE_SECURE,
            httponly=settings.AUTH_COOKIE_HTTP_ONLY,
            samesite=settings.AUTH_COOKIE_SAMESITE,
        )
        return response

class CSVRenderer(BaseRenderer):
    media_type = 'text/csv'
    format = 'csv'
    charset = 'utf-8'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data

class UserSettingsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    renderer_classes = [CSVRenderer, JSONRenderer]

    def post(self, request):
        User = get_user_model()
        access_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)

        decoded_data_access_token = AccessToken(access_token)
        user_id = decoded_data_access_token.payload.get("user_id")
        user = get_user_model().objects.get(id=user_id)

        email = request.data.get('email')
        if email:
            regex = r'^(?=.{1,100}$)[^\s@]+@[^\s@]+.[^\s@]+$'
            if not re.match(regex, email):
                return Response({"error": "Email is invalid"}, status=status.HTTP_400_BAD_REQUEST)
            elif User.objects.filter(email=email).exists():
                return Response({"error": "Email is already exists"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                user.email = email

        password = request.data.get('password')
        if password:
            regex = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$'
            if not re.match(regex, password):
                return Response({"error": "Password must contain at least 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                user.set_password(password)
                user.save(update_fields=['password'])

        username = request.data.get('username')
        if username:
            regex = r'^[a-zA-Z0-9_]{1,50}$'
            if not re.match(regex, username):
                return Response({"error": "Username must contain only letters, numbers and underscores"}, status=status.HTTP_400_BAD_REQUEST)
            elif User.objects.filter(username=username).exists():
                 return Response({"error": "Username is already exists"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                user.username = username

        user.save()
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "ALL",
            {
                "type": "redirect_receive",
                "data": {
                    "key": "UPDATE",
                    "id": user.id,
                },
            }
        )

        serializer = UserMeSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def get_games(self, user):
        from django.db import models
        from transcendence_app.models import Game

        games = Game.objects.filter(models.Q(player1=user) | models.Q(player2=user))

        return [
            {
                'game_id': game.id,
                'date': game.created_at,
                'player1_id': game.player1.id,
                'player2_id': game.player2.id,
                'winner_id': game.winner.id if game.winner else None,
                'player1_score': game.player1_score,
                'player2_score': game.player2_score,
                'tournament_name': game.tournament_name
            }
            for game in games
        ] or None

    def get(self, request):
        access_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)

        decoded_data_access_token = AccessToken(access_token)
        user_id = decoded_data_access_token.payload.get("user_id")
        user = get_user_model().objects.get(id=user_id)

        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow([
            'username',
            'email',
            'avatar',
            'friends',
            'games',
            'elo',
            'won_games',
            'lost_games',
        ])

        avatar = user.avatar.url if user.avatar else None

        friends = list(user.friends.values_list('id', flat=True)) or None
        
        games = self.get_games(user)

        writer.writerow([
            user.username,
            user.email,
            avatar,
            friends if friends else None,
            games if games else None,
            user.elo,
            user.won_games,
            user.lost_games,
        ])
        csv_content = buffer.getvalue()
        buffer.close()
        response = Response(csv_content, status=status.HTTP_200_OK)
        response["Content-Disposition"] = 'attachment; filename="user_data.csv"'
        return response

    def delete(self, request):
        access_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)

        decoded_data_access_token = AccessToken(access_token)
        user_id = decoded_data_access_token.payload.get("user_id")
        user = get_user_model().objects.get(id=user_id)
        if user.avatar or user.avatar.name:
            avatar_path = user.avatar.path
            if os.path.isfile(avatar_path):
                os.remove(avatar_path)

        user.username = "@" + str(user.id)
        user.email = "@" + str(user.id) + "@42.fr"
        user.avatar_url = None
        user.avatar = None
        user.access_token = None
        user.refresh_token = None
        user.totp_secret = None
        user.is_anonymise = True
        user.save()
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # https://github.com/django/django/blob/main/django/http/response.py
        # delete cookie not good for secure flag so reimplement direct
        response.set_cookie(
            key=settings.AUTH_COOKIE_ACCESS,
            value='',
            max_age=0,
            expires='Thu, 01 Jan 1970 00:00:00 GMT',
            path=settings.AUTH_COOKIE_PATH,
            domain=settings.AUTH_COOKIE_DOMAIN,
            secure=settings.AUTH_COOKIE_SECURE,
            httponly=settings.AUTH_COOKIE_HTTP_ONLY,
            samesite=settings.AUTH_COOKIE_SAMESITE,
        )
        response.set_cookie(
            key=settings.AUTH_COOKIE_REFRESH,
            value='',
            max_age=0,
            expires='Thu, 01 Jan 1970 00:00:00 GMT',
            path=settings.AUTH_COOKIE_PATH,
            domain=settings.AUTH_COOKIE_DOMAIN,
            secure=settings.AUTH_COOKIE_SECURE,
            httponly=settings.AUTH_COOKIE_HTTP_ONLY,
            samesite=settings.AUTH_COOKIE_SAMESITE,
        )
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "ALL",
            {
                "type": "redirect_receive",
                "data": {
                    "key": "DELETE",
                    "id": user.id,
                },
            }
        )
        return response

# #FORGOT PASSWORD
class ForgotPasswordAPIView(TokenObtainPairView):
	permission_classes = [permissions.AllowAny]
     
	PASSWORD_REGEX = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$'
	USERNAME_REGEX = r'^[a-zA-Z0-9_]{1,50}$'
	OTP_REGEX = r'^\d{6}$'

	def validate_password(self, password):
		if not password:
			raise ValidationError("Password is required")
		if not re.match(self.PASSWORD_REGEX, password):
			raise ValidationError("Password must contain at least 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character")

	def validate_username(self, username):
		if not username:
			raise ValidationError("Username is required")
		if not re.match(self.USERNAME_REGEX, username):
			raise ValidationError("Username must contain only letters, numbers and underscores")

	def validate_otp(self, otp):
		if not otp:
			raise ValidationError("OTP is required")
		if not re.match(self.OTP_REGEX, otp):
			raise ValidationError("OTP must be a 6-digit number")

	def post(self, request, *args, **kwargs):

		try :
			password = request.data.get('newPassword')
			username = request.data.get('username')
			otp = request.data.get('otp')
			self.validate_password(password)
			self.validate_username(username)
			try :
				user = get_user_model().objects.get(username=username)
			except get_user_model().DoesNotExist:
				return Response({"message": "No user found with this Username."}, status=status.HTTP_404_NOT_FOUND)
			if user.totp_enabled :
				self.validate_otp(otp)
				if not user.verify_totp(otp):
					return Response({"error": "OTP is invalid"}, status=status.HTTP_400_BAD_REQUEST)
			user.set_password(password)
			user.save()

			response = Response(status=status.HTTP_204_NO_CONTENT)

			return response
		except ValidationError as e:
			return Response(
				{"error": str(e)},
				status=status.HTTP_400_BAD_REQUEST
			)
