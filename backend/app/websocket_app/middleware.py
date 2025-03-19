# from https://stackoverflow.com/questions/65297148/django-channels-jwt-authentication
# https://github.com/django/channels/blob/main/docs/topics/authentication.rst
# https://github.com/django/channels/blob/main/channels/auth.py

from django.conf import settings
from django.contrib.auth import get_user_model
# from django.utils.crypto import constant_time_compare
from django.utils.functional import LazyObject
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from channels.sessions import CookieMiddleware
from channels.exceptions import DenyConnection

from http.cookies import SimpleCookie # python for cookie

@database_sync_to_async
def get_user(scope):
    """
    Return the user model instance associated with the given scope.
    If no user is retrieved, DenyConnection.
    """
    # postpone model import to avoid ImproperlyConfigured error before Django
    # setup is complete.
    # from django.contrib.auth.models import AnonymousUser

    print("\033[33m WebSocket MIDDLEWARE\033[0m")
    User = get_user_model()
    try:
        headers = dict(scope.get("headers", []))
        if b"cookie" not in headers:
            raise ValueError("JWTAuthMiddleware cannot find cookie in scope.")
        cookie_header = headers.get(b"cookie", b"").decode() if b"cookie" in headers else ""
        cookies = SimpleCookie(cookie_header)
        token = cookies.get(settings.AUTH_COOKIE_ACCESS)
        # postpone AccessToken import to avoid Apps aren't loaded yet.
        from rest_framework_simplejwt.tokens import AccessToken
        decoded_data_access_token = AccessToken(token.value)
        user_id = decoded_data_access_token.payload.get("user_id")
        user = User.objects.get(id=user_id)  # Ensure `user_id` is in the correct format
        if (user.is_login):
            raise ValueError("JWTAuthMiddleware already login")
        user.is_login = True # set is_login to true in db
        user.save()
    except Exception as e:
        raise DenyConnection("User authentication failed")
        # user = AnonymousUser()  # Return an AnonymousUser if the user doesn't exist
    return user


class UserLazyObject(LazyObject):
    """
    Throw a more useful error message when scope['user'] is accessed before
    it's resolved
    """

    def _setup(self):
        raise ValueError("Accessing scope user before it is ready.")


class JWTAuthMiddleware(BaseMiddleware):
    """
    Middleware which populates scope["user"] from a Simple JWT httponly.
    Requires CookieMiddleware to function.
    """

    def populate_scope(self, scope):
        # Add it to the scope if it's not there already
        if "user" not in scope:
            scope["user"] = UserLazyObject()

    async def resolve_scope(self, scope):
        scope["user"]._wrapped = await get_user(scope)

    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        # Scope injection/mutation per this middleware's needs.
        self.populate_scope(scope)
        # Grab the finalized/resolved scope
        #await self.resolve_scope(scope)

        try:
            await self.resolve_scope(scope)
        except Exception as e:
            print(f"\033[31m JWTAuthMiddleware Error {str(e)}\033[0m")
            await send({
                "type": "websocket.close",
                "code": 403
            })
            return

        return await super().__call__(scope, receive, send)


# Handy shortcut for applying all three layers at once
def JWTAuthMiddlewareStack(inner):
    return CookieMiddleware(JWTAuthMiddleware(inner))
