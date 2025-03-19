from django.http import JsonResponse

class InternalOnlyMiddleware:
    """
    Middleware pour restreindre l'accès aux vues internes basées sur l'IP.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        allowed_ips = ['127.0.0.1', 'localhost']  # IPs autorisées

        ip = request.META.get('REMOTE_ADDR')
        if request.path.startswith('/internal/') and ip not in allowed_ips:
            return JsonResponse({'error': 'Access forbidden'}, status=403)

        return self.get_response(request)
