from django import template

register = template.Library()


@register.filter
def dict_get(d, key):
    if isinstance(d, dict):
        return d.get(key, 0)
    return 0


@register.filter
def empty_dash(value):
    return value if value else '-'


@register.filter
def format_datetime(value):
    if not value:
        return '-'
    return value.strftime('%Y-%m-%d %H:%M')


@register.filter
def truncate_middle(value, length):
    if not value:
        return '-'
    if len(value) <= length:
        return value
    return value[:length] + '...'

