import requests
from django.shortcuts import redirect
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile

class RedirectTo42View(APIView):
	permission_classes = [permissions.AllowAny]

	def get(self, request):
		oauth_settings = settings.OAUTH_SETTINGS
		authorize_url = (
			f"{oauth_settings['OAUTH_AUTHORIZE_URL']}"
			f"?client_id={oauth_settings['OAUTH_CLIENT_ID']}"
			f"&redirect_uri={oauth_settings['OAUTH_REDIRECT_URI']}"
			f"&response_type=code"
			f"&scope={oauth_settings['OAUTH_SCOPE']}"
		)
		return Response({'authorize_url': authorize_url}, status=status.HTTP_200_OK)

class OAuthCallbackView(APIView):
	permission_classes = [permissions.AllowAny]

	
	def get_42_user_data(self, access_token):
		oauth_settings = settings.OAUTH_SETTINGS
		headers = {'Authorization': f'Bearer {access_token}'}
		response = requests.get(oauth_settings['OAUTH_ME'], headers=headers)
		if response.status_code != 200:
			return None
		return response.json()

	def get_or_create_user(self, user_data):
		User = get_user_model()
		email = user_data.get('email')
		username = user_data.get('login')
		if not email:
			raise ValueError("Email not provided by 42 API")

		try :
			if User.objects.get(username=username):
				return False
			user = User.objects.get(email=email)
		except User.DoesNotExist:
			user = User.objects.create_user(
				email=email,
				username=user_data.get('login'),
				agree_to_terms=True,
			)
			user.is_anonymise = False
			img_url = user_data.get('image', {}).get('link')
			if img_url:
				response = requests.get(img_url)
				if response.status_code == 200:
					file_name = f"avatar_{user.pk}.jpg"
					user.avatar.save(
						file_name,
						ContentFile(response.content),
						save=True
					)
			user.save()
			return user
		return user

	def get(self, request):
		code = request.GET.get("code")
		if not code:
			return Response(
				{"error": "Missing authorization code"},
				status=status.HTTP_400_BAD_REQUEST
			)
		oauth_settings = settings.OAUTH_SETTINGS
		token_data = {
			"grant_type": "authorization_code",
			"client_id": oauth_settings['OAUTH_CLIENT_ID'],
			"client_secret": oauth_settings['OAUTH_CLIENT_SECRET'],
			"code": code,
			"redirect_uri": oauth_settings['OAUTH_REDIRECT_URI'],
		}
		try :
			token_reponse = requests.post(
				oauth_settings['OAUTH_TOKEN_URL'],
				data=token_data
			)
			token_reponse.raise_for_status()
			token_data = token_reponse.json()

			user_data = self.get_42_user_data(token_data['access_token'])
			if not user_data:
				return Response(
					{"error": "Failed to get user data from 42"},
					status=status.HTTP_400_BAD_REQUEST
				)

			url_redirect = oauth_settings['OAUTH_REDIRECT_LOGIN']
			user = self.get_or_create_user(user_data)
			if not user:
				return redirect(url_redirect)

			refresh = RefreshToken.for_user(user)
			oauth_settings = settings.OAUTH_SETTINGS

			response = redirect(url_redirect)

			response.set_cookie(
				settings.AUTH_COOKIE_ACCESS,
				str(refresh.access_token),
				max_age=settings.AUTH_COOKIE_ACCESS_MAX_AGE,
				path=settings.AUTH_COOKIE_PATH,
				domain=settings.AUTH_COOKIE_DOMAIN,
				secure=settings.AUTH_COOKIE_SECURE,
				httponly=settings.AUTH_COOKIE_HTTP_ONLY,
				samesite=settings.AUTH_COOKIE_SAMESITE,
			)
			response.set_cookie(
				settings.AUTH_COOKIE_REFRESH,
				str(refresh),
				max_age=settings.AUTH_COOKIE_REFRESH_MAX_AGE,
				path=settings.AUTH_COOKIE_PATH,
				domain=settings.AUTH_COOKIE_DOMAIN,
				secure=settings.AUTH_COOKIE_SECURE,
				httponly=settings.AUTH_COOKIE_HTTP_ONLY,
				samesite=settings.AUTH_COOKIE_SAMESITE,
			)

			return response

		except requests.exceptions.RequestException as e:
			return Response(
				{"error": "Failed to complete OAuth process"},
				status=status.HTTP_400_BAD_REQUEST
			)
