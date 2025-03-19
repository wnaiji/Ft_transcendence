from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CustomTokenVerifyView,
    UsersListAPIView,
    UserMeRetrieveAPIView,
    UserRetrieveAPIView,
    SignupCreateAPIView,
    SignoutCreateAPIView,
    UserSettingsAPIView,
    ForgotPasswordAPIView,
    UserAvatarAPIView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view()),
    path('refresh/', CustomTokenRefreshView.as_view()),
    path('verify/', CustomTokenVerifyView.as_view()),
    path('users/', UsersListAPIView.as_view()), # retrieve all users except ourself
    path('user/me/', UserMeRetrieveAPIView.as_view()),
    path('user/<int:id>/', UserRetrieveAPIView.as_view()),
    path('signup/', SignupCreateAPIView.as_view()),
    path('signout/', SignoutCreateAPIView.as_view()),
    path('settings/', UserSettingsAPIView.as_view()),
    path('forgot-password/', ForgotPasswordAPIView.as_view()),
    path('avatar/', UserAvatarAPIView.as_view()),
]
