import logging
import time
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone

logger = logging.getLogger(__name__)


class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._audit_start_time = time.time()
        return None

    def process_response(self, request, response):
        if not hasattr(request, '_audit_start_time'):
            return response

        duration = time.time() - request._audit_start_time

        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and response.status_code in [200, 201, 302]:
            if request.user and request.user.is_authenticated:
                path = request.path
                method = request.method
                status_code = response.status_code
                user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
                ip_address = self._get_client_ip(request)

                if not path.startswith('/static/') and not path.startswith('/media/'):
                    logger.info(
                        f'AUDIT: user={request.user.username} '
                        f'method={method} path={path} status={status_code} '
                        f'duration={duration:.3f}s ip={ip_address}'
                    )

        return response

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        return ip
