from django.urls import path
from .views import (
	EnableTOTPAPIView,
	VerifyTOTPAPIView
	)

urlpatterns = [
	path("enable-totp/", EnableTOTPAPIView.as_view(), name="enable-totp"),
	path("verify-totp/", VerifyTOTPAPIView.as_view(), name="verify-totp"),
]
