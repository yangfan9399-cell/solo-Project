from django import template
from django.contrib.auth.models import User

register = template.Library()


@register.simple_tag
def get_maintenance_staff():
    return User.objects.filter(userprofile__role='maintenance_staff').select_related('userprofile', 'userprofile__company')


@register.filter
def get_status_color(status):
    colors = {
        'reported': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-orange-100 text-orange-800',
        'dispatched': 'bg-blue-100 text-blue-800',
        'parts_waiting': 'bg-purple-100 text-purple-800',
        'in_repair': 'bg-indigo-100 text-indigo-800',
        'repaired': 'bg-green-100 text-green-800',
        'reviewing': 'bg-teal-100 text-teal-800',
        'returned': 'bg-red-100 text-red-800',
        'archived': 'bg-gray-100 text-gray-800',
    }
    return colors.get(status, 'bg-gray-100 text-gray-800')
