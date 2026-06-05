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


@register.filter
def get_plan_status_color(status):
    colors = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'in_progress': 'bg-blue-100 text-blue-800',
        'submitted': 'bg-orange-100 text-orange-800',
        'reviewing': 'bg-teal-100 text-teal-800',
        'approved': 'bg-green-100 text-green-800',
        'returned': 'bg-red-100 text-red-800',
        'completed': 'bg-gray-100 text-gray-800',
        'cancelled': 'bg-gray-200 text-gray-600',
    }
    return colors.get(status, 'bg-gray-100 text-gray-800')


@register.filter
def plan_status_in(status, status_list):
    return status in status_list.split(',')
