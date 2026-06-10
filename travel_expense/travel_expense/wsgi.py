"""
WSGI config for travel_expense project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'travel_expense.settings')

application = get_wsgi_application()
