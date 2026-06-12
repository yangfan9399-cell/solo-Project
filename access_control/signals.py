from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import AccessRecoveryRecord, ProcessingNode, FieldChangeLog, EvidenceAttachment
from .services import WorkflowService
from django.contrib import messages
import json


@receiver(pre_save, sender=AccessRecoveryRecord)
def capture_record_changes(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = AccessRecoveryRecord.objects.get(pk=instance.pk)
            instance._old_values = WorkflowService._record_to_dict(old_instance)
        except AccessRecoveryRecord.DoesNotExist:
            instance._old_values = {}


@receiver(post_save, sender=AccessRecoveryRecord)
def sync_record_data(sender, instance, created, **kwargs):
    if created:
        return

    old_values = getattr(instance, '_old_values', {})
    if not old_values:
        return

    new_values = WorkflowService._record_to_dict(instance)
    diff = WorkflowService._calculate_diff(old_values, new_values)

    key_fields_changed = [
        field for field in diff.keys()
        if field in WorkflowService.KEY_FIELDS or field in WorkflowService.KEY_FIELD_LABELS
    ]

    if key_fields_changed:
        existing_logs = FieldChangeLog.objects.filter(
            record=instance,
            node__isnull=True,
            field_name__in=key_fields_changed,
            changed_at__gte=timezone.now() - timezone.timedelta(seconds=5)
        )

        if not existing_logs.exists():
            for field_name in key_fields_changed:
                change = diff[field_name]
                FieldChangeLog.objects.create(
                    record=instance,
                    field_name=field_name,
                    field_label=WorkflowService.KEY_FIELD_LABELS.get(field_name, field_name),
                    old_value=str(change['old']) if change['old'] is not None else '',
                    new_value=str(change['new']) if change['new'] is not None else '',
                    changed_by=getattr(instance, '_modified_by', None)
                )

        instance.snapshot_after = new_values


@receiver(post_save, sender=EvidenceAttachment)
def update_record_on_evidence_change(sender, instance, created, **kwargs):
    record = instance.record
    if record and record.sample_type == AccessRecoveryRecord.SampleType.EVIDENCE_MISSING:
        evidences = record.evidences.filter(is_valid=True)
        provided_types = set(e.evidence_type for e in evidences)
        required_types = {'PHOTO', 'SIGNATURE', 'ACCESS_LOG'}
        missing = required_types - provided_types

        if not missing:
            record.is_blocked = False
            record.has_anomaly = False
            record.block_reason = ''
            record.diff_fields.pop('required_evidences', None)
            record.save()

            ProcessingNode.objects.create(
                record=record,
                node_type=ProcessingNode.NodeType.UNBLOCK,
                node_title='证据补充完成，解除阻断',
                description=f'已补充全部必需证据：现场照片、签字确认、门禁日志',
                operator=instance.uploaded_by,
                previous_status=record.status,
                new_status=record.status,
            )
