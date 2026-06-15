from django import template

register = template.Library()


@register.filter
def avg(lst):
    if not lst:
        return 0
    return round(sum(lst) / len(lst), 1)


@register.filter
def half(value):
    try:
        return int(value) // 2
    except (ValueError, TypeError):
        return 0
