from .services import WorkflowService
from .models import AccessRecoveryRecord


def global_stats(request):
    if not request.user.is_authenticated:
        return {}

    try:
        stats = WorkflowService.get_dashboard_stats()

        my_pending = 0
        if request.user.is_field_staff:
            my_pending = AccessRecoveryRecord.objects.filter(
                current_owner=request.user,
                is_archived=False
            ).count()
        elif request.user.is_reviewer:
            my_pending = AccessRecoveryRecord.objects.filter(
                status=AccessRecoveryRecord.Status.REVIEWING,
                is_archived=False
            ).count()

        return {
            'global_stats': stats,
            'my_pending_count': my_pending,
        }
    except Exception as e:
        return {}
