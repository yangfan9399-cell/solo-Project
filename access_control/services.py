from django.db import transaction
from django.utils import timezone
from django.contrib import messages
from .models import (
    AccessRecoveryRecord, ProcessingNode, EvidenceAttachment,
    FieldChangeLog, AnomalyBlockRecord
)
from accounts.models import User
import json


class WorkflowService:
    KEY_FIELDS = [
        'expiry_date', 'recovered_date', 'deadline',
        'applicant_name', 'applicant_dept', 'applicant_id',
        'involved_amount', 'authorized_person_count',
        'conclusion', 'recovery_basis', 'risk_level'
    ]

    KEY_FIELD_LABELS = {
        'expiry_date': '到期日期',
        'recovered_date': '实际回收日期',
        'deadline': '处理截止时间',
        'applicant_name': '申请人姓名',
        'applicant_dept': '申请人部门',
        'applicant_id': '申请人工号',
        'involved_amount': '涉及金额',
        'authorized_person_count': '授权人数',
        'conclusion': '处理结论',
        'recovery_basis': '采用依据',
        'risk_level': '风险等级',
    }

    @classmethod
    @transaction.atomic
    def accept_record(cls, record_id, operator, remarks=''):
        record = AccessRecoveryRecord.objects.select_for_update().get(pk=record_id)
        if record.status != AccessRecoveryRecord.Status.PENDING_ACCEPT:
            raise ValueError('只有待受理状态的记录才能被受理')

        snapshot_before = cls._record_to_dict(record)
        previous_status = record.status

        record.status = AccessRecoveryRecord.Status.ACCEPTED
        record.accepted_by = operator
        record.accepted_at = timezone.now()
        record.current_owner = operator
        record.save()

        snapshot_after = cls._record_to_dict(record)

        node = ProcessingNode.objects.create(
            record=record,
            node_type=ProcessingNode.NodeType.ACCEPT,
            node_title='受理申请',
            description=f'{operator.get_full_name()} 受理了该回收申请',
            operator=operator,
            previous_status=previous_status,
            new_status=record.status,
            field_changes={'status': {'old': previous_status, 'new': record.status}},
            remarks=remarks
        )

        cls._create_field_change_logs(record, node, snapshot_before, snapshot_after, operator)
        record.snapshot_before = snapshot_before
        record.save()

        return record, node

    @classmethod
    @transaction.atomic
    def process_record(cls, record_id, operator, business_note='', site_description='',
                       recovered_date=None, conclusion='', recovery_basis='',
                       remedial_path='', diff_fields=None):
        record = AccessRecoveryRecord.objects.select_for_update().get(pk=record_id)
        if record.status not in [AccessRecoveryRecord.Status.ACCEPTED,
                                  AccessRecoveryRecord.Status.PROCESSING,
                                  AccessRecoveryRecord.Status.REJECTED]:
            raise ValueError('只有已受理、处理中或已退回状态的记录才能处理')

        if operator.is_reviewer:
            pass
        elif not operator.is_field_staff:
            raise ValueError('只有现场人员或主管复核人才能处理记录')

        snapshot_before = cls._record_to_dict(record)
        previous_status = record.status

        record.business_note = business_note or record.business_note
        record.site_description = site_description or record.site_description
        record.conclusion = conclusion or record.conclusion
        record.recovery_basis = recovery_basis or record.recovery_basis
        record.remedial_path = remedial_path or record.remedial_path

        if recovered_date:
            record.recovered_date = recovered_date

        if diff_fields:
            record.diff_fields = {**record.diff_fields, **diff_fields}

        if record.status == AccessRecoveryRecord.Status.ACCEPTED:
            record.status = AccessRecoveryRecord.Status.PROCESSING
        record.processed_by = operator
        record.processed_at = timezone.now()
        record.save()

        snapshot_after = cls._record_to_dict(record)

        node = ProcessingNode.objects.create(
            record=record,
            node_type=ProcessingNode.NodeType.PROCESS,
            node_title='处理申请',
            description=f'{operator.get_full_name()} 处理了该回收申请',
            operator=operator,
            previous_status=previous_status,
            new_status=record.status,
            field_changes=cls._calculate_diff(snapshot_before, snapshot_after),
            remarks=conclusion[:200] if conclusion else ''
        )

        cls._create_field_change_logs(record, node, snapshot_before, snapshot_after, operator)

        if record.sample_type != AccessRecoveryRecord.SampleType.NORMAL_RELEASE:
            cls._check_and_create_anomaly(record, node, operator)

        record.snapshot_after = snapshot_after
        record.save()

        return record, node

    @classmethod
    @transaction.atomic
    def submit_for_review(cls, record_id, operator, remarks=''):
        record = AccessRecoveryRecord.objects.select_for_update().get(pk=record_id)
        if record.status != AccessRecoveryRecord.Status.PROCESSING:
            raise ValueError('只有处理中状态的记录才能提交复核')
        if not operator.is_field_staff:
            raise ValueError('只有现场人员才能提交复核')

        snapshot_before = cls._record_to_dict(record)
        previous_status = record.status

        record.status = AccessRecoveryRecord.Status.REVIEWING
        record.current_owner = None
        record.save()

        snapshot_after = cls._record_to_dict(record)

        node = ProcessingNode.objects.create(
            record=record,
            node_type=ProcessingNode.NodeType.SUBMIT_REVIEW,
            node_title='提交复核',
            description=f'{operator.get_full_name()} 提交该申请进入复核阶段',
            operator=operator,
            previous_status=previous_status,
            new_status=record.status,
            field_changes=cls._calculate_diff(snapshot_before, snapshot_after),
            remarks=remarks
        )

        cls._create_field_change_logs(record, node, snapshot_before, snapshot_after, operator)

        return record, node

    @classmethod
    @transaction.atomic
    def review_approve(cls, record_id, operator, remarks=''):
        record = AccessRecoveryRecord.objects.select_for_update().get(pk=record_id)
        if record.status != AccessRecoveryRecord.Status.REVIEWING:
            raise ValueError('只有复核中状态的记录才能复核通过')
        if not operator.is_reviewer and not operator.is_admin and not operator.is_superuser:
            raise ValueError('只有主管复核人或管理员才能复核通过')

        snapshot_before = cls._record_to_dict(record)
        previous_status = record.status

        record.status = AccessRecoveryRecord.Status.ARCHIVED
        record.is_archived = True
        record.reviewed_by = operator
        record.reviewed_at = timezone.now()
        record.archived_by = operator
        record.archived_at = timezone.now()
        record.save()

        snapshot_after = cls._record_to_dict(record)

        node = ProcessingNode.objects.create(
            record=record,
            node_type=ProcessingNode.NodeType.REVIEW_PASS,
            node_title='复核通过并归档',
            description=f'{operator.get_full_name()} 复核通过并归档该申请',
            operator=operator,
            previous_status=previous_status,
            new_status=record.status,
            field_changes=cls._calculate_diff(snapshot_before, snapshot_after),
            remarks=remarks
        )

        cls._create_field_change_logs(record, node, snapshot_before, snapshot_after, operator)

        return record, node

    @classmethod
    @transaction.atomic
    def review_reject(cls, record_id, operator, reject_reason, remedial_path=''):
        record = AccessRecoveryRecord.objects.select_for_update().get(pk=record_id)
        if record.status != AccessRecoveryRecord.Status.REVIEWING:
            raise ValueError('只有复核中状态的记录才能退回')
        if not operator.is_reviewer and not operator.is_admin and not operator.is_superuser:
            raise ValueError('只有主管复核人或管理员才能退回补证')

        snapshot_before = cls._record_to_dict(record)
        previous_status = record.status

        record.status = AccessRecoveryRecord.Status.REJECTED
        record.remedial_path = remedial_path or record.remedial_path
        record.reviewed_by = operator
        record.reviewed_at = timezone.now()
        record.current_owner = record.processed_by
        record.save()

        snapshot_after = cls._record_to_dict(record)

        node = ProcessingNode.objects.create(
            record=record,
            node_type=ProcessingNode.NodeType.REVIEW_REJECT,
            node_title='复核退回补证',
            description=f'{operator.get_full_name()} 退回该申请要求补证，原因：{reject_reason}',
            operator=operator,
            previous_status=previous_status,
            new_status=record.status,
            field_changes=cls._calculate_diff(snapshot_before, snapshot_after),
            remarks=reject_reason
        )

        cls._create_field_change_logs(record, node, snapshot_before, snapshot_after, operator)

        return record, node

    @classmethod
    @transaction.atomic
    def archive_record(cls, record_id, operator, remarks=''):
        record = AccessRecoveryRecord.objects.select_for_update().get(pk=record_id)
        if not record.can_archive(operator):
            raise ValueError('该记录无法归档或权限不足')

        snapshot_before = cls._record_to_dict(record)
        previous_status = record.status

        record.status = AccessRecoveryRecord.Status.ARCHIVED
        record.is_archived = True
        record.archived_by = operator
        record.archived_at = timezone.now()
        record.save()

        snapshot_after = cls._record_to_dict(record)

        node = ProcessingNode.objects.create(
            record=record,
            node_type=ProcessingNode.NodeType.ARCHIVE,
            node_title='归档',
            description=f'{operator.get_full_name()} 归档该申请',
            operator=operator,
            previous_status=previous_status,
            new_status=record.status,
            field_changes=cls._calculate_diff(snapshot_before, snapshot_after),
            remarks=remarks
        )

        cls._create_field_change_logs(record, node, snapshot_before, snapshot_after, operator)

        return record, node

    @classmethod
    @transaction.atomic
    def reopen_record(cls, record_id, operator, reason=''):
        record = AccessRecoveryRecord.objects.select_for_update().get(pk=record_id)
        if not record.is_archived:
            raise ValueError('只有已归档的记录才能重新处理')
        if not operator.is_reviewer and not operator.is_admin and not operator.is_superuser:
            raise ValueError('只有主管复核人或管理员才能重新处理')

        snapshot_before = cls._record_to_dict(record)
        previous_status = record.status

        record.status = AccessRecoveryRecord.Status.PROCESSING
        record.is_archived = False
        record.archived_by = None
        record.archived_at = None
        record.current_owner = operator
        record.save()

        snapshot_after = cls._record_to_dict(record)

        node = ProcessingNode.objects.create(
            record=record,
            node_type=ProcessingNode.NodeType.REOPEN,
            node_title='重新处理',
            description=f'{operator.get_full_name()} 重新处理该归档记录，原因：{reason}',
            operator=operator,
            previous_status=previous_status,
            new_status=record.status,
            field_changes=cls._calculate_diff(snapshot_before, snapshot_after),
            remarks=reason
        )

        cls._create_field_change_logs(record, node, snapshot_before, snapshot_after, operator)

        return record, node

    @classmethod
    def _check_and_create_anomaly(cls, record, node, operator):
        anomaly_configs = {
            AccessRecoveryRecord.SampleType.OVER_LIMIT: {
                'block_code': 'ANOMALY-001',
                'block_reason': '关键指标超限：授权人数或涉及金额超过规定阈值',
                'diff_fields': {
                    'authorized_person_count': {
                        'limit': 50,
                        'actual': record.authorized_person_count,
                        'exceeded': record.authorized_person_count > 50
                    },
                    'involved_amount': {
                        'limit': 100000,
                        'actual': float(record.involved_amount),
                        'exceeded': float(record.involved_amount) > 100000
                    }
                },
                'remedial_path': '1. 核实超限原因并提交书面说明；2. 补充审批层级签字；3. 提交风险评估报告；4. 经部门主任审批后重新提交'
            },
            AccessRecoveryRecord.SampleType.EVIDENCE_MISSING: {
                'block_code': 'ANOMALY-002',
                'block_reason': '现场证据缺失：缺少必要的现场照片、签字确认或门禁日志',
                'diff_fields': {
                    'required_evidences': {
                        'required': ['PHOTO', 'SIGNATURE', 'ACCESS_LOG'],
                        'provided': [e.evidence_type for e in record.evidences.filter(is_valid=True)],
                        'missing': [e for e in ['PHOTO', 'SIGNATURE', 'ACCESS_LOG']
                                    if e not in [ev.evidence_type for ev in record.evidences.filter(is_valid=True)]]
                    }
                },
                'remedial_path': '1. 补充现场照片（含时间地点水印）；2. 补全相关人员签字确认；3. 导出对应时间段门禁日志；4. 由现场主管核验后重新上传'
            },
            AccessRecoveryRecord.SampleType.TIMEOUT: {
                'block_code': 'ANOMALY-003',
                'block_reason': f'审批超时：已超过处理截止时间 {record.days_overdue} 天',
                'diff_fields': {
                    'deadline': {
                        'expected': record.deadline.strftime('%Y-%m-%d %H:%M:%S') if record.deadline else '未设置',
                        'actual': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'days_overdue': record.days_overdue
                    }
                },
                'remedial_path': '1. 提交超时情况说明；2. 说明延迟原因及改进措施；3. 由主管复核人审批延期；4. 设定新的处理截止时间'
            }
        }

        config = anomaly_configs.get(record.sample_type)
        if config:
            record.is_blocked = True
            record.has_anomaly = True
            record.block_reason = config['block_reason']
            record.remedial_path = config['remedial_path']
            record.diff_fields = {**record.diff_fields, **config['diff_fields']}
            record.save()

            AnomalyBlockRecord.objects.create(
                record=record,
                node=node,
                block_code=config['block_code'],
                block_reason=config['block_reason'],
                diff_fields=config['diff_fields'],
                remedial_path=config['remedial_path'],
                blocked_by=operator
            )

            ProcessingNode.objects.create(
                record=record,
                node_type=ProcessingNode.NodeType.BLOCK,
                node_title='异常阻断',
                description=f'系统检测到异常：{config["block_reason"]}',
                operator=operator,
                previous_status=record.status,
                new_status=record.status,
                remarks=config['remedial_path']
            )

    @classmethod
    def _record_to_dict(cls, record):
        return {
            'status': record.status,
            'expiry_date': str(record.expiry_date) if record.expiry_date else None,
            'recovered_date': str(record.recovered_date) if record.recovered_date else None,
            'deadline': str(record.deadline) if record.deadline else None,
            'applicant_name': record.applicant_name,
            'applicant_dept': record.applicant_dept,
            'applicant_id': record.applicant_id,
            'involved_amount': float(record.involved_amount),
            'authorized_person_count': record.authorized_person_count,
            'conclusion': record.conclusion,
            'recovery_basis': record.recovery_basis,
            'risk_level': record.risk_level,
            'business_note': record.business_note,
            'site_description': record.site_description,
            'remedial_path': record.remedial_path,
            'is_blocked': record.is_blocked,
            'is_archived': record.is_archived,
            'current_owner_id': record.current_owner_id,
        }

    @classmethod
    def _calculate_diff(cls, before, after):
        changes = {}
        for key in set(before.keys()) | set(after.keys()):
            if before.get(key) != after.get(key):
                changes[key] = {
                    'old': before.get(key),
                    'new': after.get(key),
                    'label': cls.KEY_FIELD_LABELS.get(key, key)
                }
        return changes

    @classmethod
    def _create_field_change_logs(cls, record, node, snapshot_before, snapshot_after, operator):
        diff = cls._calculate_diff(snapshot_before, snapshot_after)
        for field_name, change in diff.items():
            if field_name in cls.KEY_FIELDS or field_name in cls.KEY_FIELD_LABELS:
                FieldChangeLog.objects.create(
                    record=record,
                    node=node,
                    field_name=field_name,
                    field_label=cls.KEY_FIELD_LABELS.get(field_name, field_name),
                    old_value=str(change['old']) if change['old'] is not None else '',
                    new_value=str(change['new']) if change['new'] is not None else '',
                    changed_by=operator
                )

    @classmethod
    def get_record_summary(cls, record):
        return {
            'id': record.id,
            'record_no': record.record_no,
            'title': record.title,
            'status': record.status,
            'status_display': record.get_status_display(),
            'status_class': record.get_status_display_class(),
            'sample_type': record.sample_type,
            'sample_type_display': record.get_sample_type_display(),
            'source': record.get_source_display(),
            'applicant_name': record.applicant_name,
            'lab_name': record.lab_name,
            'expiry_date': str(record.expiry_date),
            'is_overdue': record.is_overdue,
            'days_overdue': record.days_overdue,
            'risk_level': record.risk_level,
            'risk_class': record.get_risk_display_class(),
            'current_owner': record.current_owner.get_full_name() if record.current_owner else '待分配',
            'created_at': str(record.created_at),
            'has_anomaly': record.has_anomaly,
            'is_blocked': record.is_blocked,
        }

    @classmethod
    def get_dashboard_stats(cls, filters=None):
        queryset = AccessRecoveryRecord.objects.all()
        if filters:
            if 'start_date' in filters and filters['start_date']:
                queryset = queryset.filter(created_at__date__gte=filters['start_date'])
            if 'end_date' in filters and filters['end_date']:
                queryset = queryset.filter(created_at__date__lte=filters['end_date'])
            if 'sample_type' in filters and filters['sample_type']:
                queryset = queryset.filter(sample_type=filters['sample_type'])
            if 'status' in filters and filters['status']:
                queryset = queryset.filter(status=filters['status'])

        total = queryset.count()
        stats = {
            'total': total,
            'by_status': {},
            'by_sample_type': {},
            'by_risk_level': {},
            'overdue_count': queryset.filter(is_archived=False, deadline__lt=timezone.now()).count(),
            'blocked_count': queryset.filter(is_blocked=True).count(),
            'avg_processing_days': 0,
        }

        for status, _ in AccessRecoveryRecord.Status.choices:
            count = queryset.filter(status=status).count()
            stats['by_status'][status] = {
                'count': count,
                'percentage': (count / total * 100) if total > 0 else 0
            }

        for sample_type, _ in AccessRecoveryRecord.SampleType.choices:
            count = queryset.filter(sample_type=sample_type).count()
            stats['by_sample_type'][sample_type] = {
                'count': count,
                'percentage': (count / total * 100) if total > 0 else 0
            }

        for risk_level in ['low', 'medium', 'high', 'critical']:
            count = queryset.filter(risk_level=risk_level).count()
            stats['by_risk_level'][risk_level] = {
                'count': count,
                'percentage': (count / total * 100) if total > 0 else 0
            }

        archived_records = queryset.filter(is_archived=True, accepted_at__isnull=False, archived_at__isnull=False)
        if archived_records.exists():
            total_days = sum((r.archived_at - r.accepted_at).days for r in archived_records)
            stats['avg_processing_days'] = round(total_days / archived_records.count(), 1)

        return stats
