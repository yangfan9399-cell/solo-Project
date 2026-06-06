from django import template

register = template.Library()


@register.filter
def abs_value(value):
    try:
        return abs(float(value))
    except (ValueError, TypeError):
        return value


@register.filter
def to_int(value):
    try:
        return int(value)
    except (ValueError, TypeError):
        return 0
