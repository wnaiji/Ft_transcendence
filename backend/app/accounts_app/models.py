#https://docs.djangoproject.com/en/5.1/topics/auth/customizing/
#https://github.com/django/django/blob/main/django/contrib/auth/models.py#L245

#WxY added
import pyotp
from cryptography.fernet import Fernet
from django.conf import settings

from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser, PermissionsMixin
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, username, email, agree_to_terms, password=None):
        if not username:
            raise ValueError("create_user: User must have an username")
        if not email:
            raise ValueError("create_user: User must have an email")
        if not agree_to_terms:
            raise ValueError("create_user: User must agree to the terms and conditions")

        email = self.normalize_email(email).lower()
        user = self.model(
            username=username,
            email=email,
            agree_to_terms=agree_to_terms,
            terms_accepted_at=timezone.now(),
        )
        user.is_active = True
        user.is_anonymise = True
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, username, email, agree_to_terms=True, password=None):
        user = self.create_user(
            username=username,
            email=email,
            agree_to_terms=agree_to_terms,
            password=password,
        )
        user.is_active = True
        user.is_admin = True
        user.totp_enabled = True
        user.is_anonymise = False
        user.save(using=self._db)
        return user

class User(AbstractBaseUser, PermissionsMixin):
    username_validator = UnicodeUsernameValidator()
    username = models.CharField(
        max_length=20,
        unique=True,
        help_text="Required. 20 characters or fewer. Letters, digits and @/./+/-/_ only.",
        validators=[username_validator],
        error_messages={
            "unique": "A user with that username already exists.",
        },
    )
    email = models.EmailField(
        verbose_name="email address",
        max_length=255,
        unique=True,
    )

    """AVATAR"""
    def validate_file_size(value):
        filesize = value.size
        if filesize > 2 * 1024 * 1024:
            raise ValidationError("The maximum file size that can be uploaded is 2MB")
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(['jpg', 'jpeg', 'png']),
            validate_file_size,
        ],
        help_text="Accepted formats: JPG, JPEG, PNG. Maximum size: 2Mb."
    )
    """END AVATAR"""

    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_anonymise = models.BooleanField(default=True)

    # Here start added some custom fields
    # date_joined = models.DateTimeField("date joined", default=timezone.now)

    agree_to_terms = models.BooleanField(
        default=False,
        blank=False,
        null=False,
    )
    terms_accepted_at = models.DateTimeField(
        null=False,
        blank=False,
    )


    """ACCESS TOKEN"""
    access_token = models.CharField(max_length=512, blank=True, null=True)
    refresh_token = models.CharField(max_length=512, blank=True, null=True)

    def set_access_token(self, token):
        self.access_token = self.encrypt(token)
        self.save()

    def set_refresh_token(self, token):
        self.refresh_token = self.encrypt(token)
        self.save()

    def get_access_token(self):
        return self.decrypt(self.access_token)

    def get_refresh_token(self):
        return self.decrypt(self.refresh_token)
    """END ACCESS TOKEN"""

    """TOTP"""
    totp_secret = models.CharField(max_length=1024, blank=True, null=True)
    totp_enabled = models.BooleanField(default=False)
    totp_generated_at = models.DateTimeField(null=True, blank=True)

    def generate_totp_secret(self):
        try :
            totp = pyotp.TOTP(pyotp.random_base32())
            self.set_totp_secret(totp.secret)
            self.totp_generated_at = timezone.now()
            self.save()
            return True
        except Exception as e:
            return False

    def verify_totp(self, token):
        if not self.totp_secret:
            return False
        try :
            secret = self.get_totp_secret()
            if not secret:
                return False
            totp = pyotp.TOTP(secret)
            return totp.verify(token)
        except Exception as e:
            return False

    def get_totp_uri(self):
        if not self.totp_secret:
            return None
        try :
            secret = self.get_totp_secret()
            if not secret:
                return None
            totp = pyotp.TOTP(secret)
            return totp.provisioning_uri(
            name=self.email,
            issuer_name="Transcendence",
            )
        except Exception as e:
            return None

    def set_totp_secret(self, secret):
        try :
            if not secret:
                return False
            self.totp_secret = self.encrypt(secret)
            self.save()
            return True
        except Exception as e:
            return False

    def get_totp_secret(self):
        try :
            if not self.totp_secret:
                return None
            return self.decrypt(self.totp_secret)
        except Exception as e:
            return None
    """END TOTP"""

    """CRYPTO"""
    def encrypt(self, value):
        cipher_suite = Fernet(settings.ENCRYPTION_KEY)
        return cipher_suite.encrypt(value.encode()).decode()

    def decrypt(self, value):
        cipher_suite = Fernet(settings.ENCRYPTION_KEY)
        return cipher_suite.decrypt(value.encode()).decode()
    """END CRYPTO"""

    is_login = models.BooleanField(default=False)

    won_games = models.IntegerField(default=0)
    lost_games = models.IntegerField(default=0)
    elo = models.IntegerField(default=1500) # 1500 <3

    # needed for chat
    blocked_users = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='blocked_by',
        blank=True
    )

    # needed for User Management
    friends = models.ManyToManyField(
        'self',
        symmetrical=True,
        blank=True
    )
    incoming_friends = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='incoming_friends_receive',
        blank=True
    )

    # for 1v1/tournament
    leader = models.BooleanField(default=False) # useful for tournament
    lock = models.BooleanField(default=False) # useful for reconnect
    one_v_one = models.ManyToManyField(
        'self',
        symmetrical=True,
        blank=True
    )
    incoming_one_v_one = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='incoming_one_v_one_receive',
        blank=True
    )
    tournament = models.ManyToManyField(
        'self',
        symmetrical=True,
        blank=True
    )
    incoming_tournament = models.ManyToManyField(
        'self',
        symmetrical=False,
        related_name='incoming_tournament_receive',
        blank=True
    )


    objects = UserManager()

    EMAIL_FIELD = "email" # useful when programmatically use or features django
    USERNAME_FIELD = "username" # when USERNAME_FIELD it's implicitly a REQUIRED_FIELDS
    REQUIRED_FIELDS = ["email", "agree_to_terms"] # "otp_secret"

    def __str__(self):
        return self.username

    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        # Simplest possible answer: Yes, always
        return True

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        # Simplest possible answer: Yes, always
        return True

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        # Simplest possible answer: All admins are staff
        return self.is_admin
