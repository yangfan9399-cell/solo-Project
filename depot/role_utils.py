from functools import wraps
from django.http import HttpResponse


def get_user_role(request):
    if not request.user.is_authenticated:
        return None
    try:
        staff = request.user.staff
        return staff.role
    except Exception:
        return None


def get_role_display(role_code):
    role_map = {
        "clerk": "店员",
        "supervisor": "片区主管",
        "cs_specialist": "客服专员",
    }
    return role_map.get(role_code, "管理员")


ROLE_PRIORITIES = {
    "clerk": ["reminders", "abnormals", "packages", "returns"],
    "supervisor": ["retention", "responsibilities", "dashboard", "abnormals"],
    "cs_specialist": ["complaints", "abnormals", "reminders"],
}


def get_priority_for_role(role):
    return ROLE_PRIORITIES.get(role, [])


def role_context(request):
    role = get_user_role(request)
    return {
        "current_role": role,
        "current_role_display": get_role_display(role),
        "role_priorities": get_priority_for_role(role),
    }
