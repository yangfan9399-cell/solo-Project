"""
WSGI config for train_dining project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'train_dining.settings')
application = get_wsgi_application()
