from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db.models import F
from django.utils import timezone
from datetime import timedelta
from workstation.models import (
    ExaminationType, Patient, Appointment,
    AppointmentStatus, ReportStatus,
    RescheduleRecord, ReportClaimRecord, AbnormalRecord, OperationLog
)


class Command(BaseCommand):
    help = 'Initialize sample data for the clinic system with complete records'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data with complete records...')

        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('Created superuser: admin/admin123'))

        if not User.objects.filter(username='operator').exists():
            operator = User.objects.create_user('operator', 'operator@example.com', 'operator123')
            operator.is_staff = True
            operator.save()
            self.stdout.write(self.style.SUCCESS('Created operator: operator/operator123'))

        if not User.objects.filter(username='reviewer').exists():
            reviewer = User.objects.create_user('reviewer', 'reviewer@example.com', 'reviewer123')
            reviewer.is_staff = True
            reviewer.save()
            self.stdout.write(self.style.SUCCESS('Created reviewer: reviewer/reviewer123'))

        admin_user = User.objects.get(username='admin')
        operator_user = User.objects.get(username='operator')
        reviewer_user = User.objects.get(username='reviewer')

        exam_types = [
            ('CT检查', '放射科', 30),
            ('MRI检查', '放射科', 45),
            ('B超检查', '超声科', 20),
            ('心电图', '心内科', 15),
            ('血常规', '检验科', 10),
            ('X光检查', '放射科', 15),
        ]
        for name, dept, duration in exam_types:
            ExaminationType.objects.get_or_create(
                name=name,
                defaults={'department': dept, 'estimated_duration': duration}
            )
        self.stdout.write(self.style.SUCCESS('Created examination types'))

        patients_data = [
            ('110101199001011234', '张三', 'M', '1990-01-01', '13800138001'),
            ('110101199203152345', '李四', 'F', '1992-03-15', '13800138002'),
            ('110101198506203456', '王五', 'M', '1985-06-20', '13800138003'),
            ('110101199512084567', '赵六', 'F', '1995-12-08', '13800138004'),
            ('110101198009105678', '钱七', 'M', '1980-09-10', '13800138005'),
            ('110101198805236789', '孙八', 'F', '1988-05-23', '13800138006'),
        ]
        for id_card, name, gender, birth_date, phone in patients_data:
            Patient.objects.get_or_create(
                id_card=id_card,
                defaults={
                    'name': name,
                    'gender': gender,
                    'birth_date': birth_date,
                    'phone': phone
                }
            )
        self.stdout.write(self.style.SUCCESS('Created patients'))

        patients = list(Patient.objects.all()[:6])
        exam_types_list = list(ExaminationType.objects.all()[:6])

        base_time = timezone.now().replace(hour=8, minute=0, second=0, microsecond=0)

        Appointment.objects.all().delete()
        RescheduleRecord.objects.all().delete()
        ReportClaimRecord.objects.all().delete()
        AbnormalRecord.objects.all().delete()
        OperationLog.objects.all().delete()

        # ============================================
        # 类别1: 按时检查 (on_time)
        # ============================================
        self.stdout.write('Creating 按时检查 records...')
        for i in range(3):
            patient = patients[i]
            exam = exam_types_list[i]
            appt_time = base_time + timedelta(days=-i - 1, hours=i * 2)
            
            apt = Appointment.objects.create(
                appointment_no=f'APT-ONTIME-{i+1:03d}',
                patient=patient,
                examination_type=exam,
                original_appointment_time=appt_time,
                current_appointment_time=appt_time,
                status=AppointmentStatus.COMPLETED,
                report_status=ReportStatus.VERIFIED,
                room=f'ROOM-{i+1:02d}',
                check_in_time=appt_time + timedelta(minutes=-5),
                completion_time=appt_time + timedelta(minutes=exam.estimated_duration),
                notes=f'按时完成{exam.name}检查',
                created_by=admin_user,
            )
            
            claim = ReportClaimRecord.objects.create(
                appointment=apt,
                claim_type='self',
                claimant_name=patient.name,
                claimant_id_card=patient.id_card,
                claimant_phone=patient.phone,
                verification_result='match',
                verification_notes='身份核验通过，身份证原件比对一致',
                is_blocked=False,
                operator=operator_user,
                reviewer=reviewer_user,
                review_status='approved',
                review_notes='资料齐全，领取流程合规',
                evidence='患者身份证原件核验，签名确认领取',
                claimed_at=appt_time + timedelta(hours=24),
            )
            
            OperationLog.objects.create(
                appointment=apt,
                operation_type='create',
                operator=admin_user,
                details=f'创建预约：{apt.appointment_no}',
                evidence='系统自动创建'
            )
            OperationLog.objects.create(
                appointment=apt,
                operation_type='claim',
                operator=operator_user,
                details=f'报告领取成功，领取人：{patient.name}',
                evidence='本人身份证核验通过'
            )
            OperationLog.objects.create(
                appointment=apt,
                operation_type='review',
                operator=reviewer_user,
                details='复核通过，报告领取已确认',
                evidence='资料齐全，流程合规'
            )
        self.stdout.write(self.style.SUCCESS('  Created 3 按时检查 records with full history'))

        # ============================================
        # 类别2: 患者改期 (patient_rescheduled)
        # ============================================
        self.stdout.write('Creating 患者改期 records...')
        for i in range(3):
            patient = patients[3 + i % 3]
            exam = exam_types_list[3 + i % 3]
            original_time = base_time + timedelta(days=i + 1, hours=9)
            new_time = original_time + timedelta(days=2, hours=2)
            
            apt = Appointment.objects.create(
                appointment_no=f'APT-RESCHED-{i+1:03d}',
                patient=patient,
                examination_type=exam,
                original_appointment_time=original_time,
                current_appointment_time=new_time,
                status=AppointmentStatus.RESCHEDULED,
                report_status=ReportStatus.PENDING,
                room=f'ROOM-{i+4:02d}',
                notes=f'{exam.name}检查已改期',
                created_by=admin_user,
            )
            
            RescheduleRecord.objects.create(
                appointment=apt,
                old_time=original_time,
                new_time=new_time,
                reason='patient',
                reason_detail='患者因工作安排冲突，无法按时就诊，电话申请改期',
                operator=operator_user,
                evidence='患者来电录音记录，工单号：CALL20240601001'
            )
            
            OperationLog.objects.create(
                appointment=apt,
                operation_type='create',
                operator=admin_user,
                details=f'创建预约：{apt.appointment_no}',
                evidence='系统自动创建'
            )
            OperationLog.objects.create(
                appointment=apt,
                operation_type='reschedule',
                operator=operator_user,
                details=f'改期: {original_time} -> {new_time}, 原因: 患者原因',
                evidence='患者来电申请改期，已确认新时间'
            )
        self.stdout.write(self.style.SUCCESS('  Created 3 患者改期 records with RescheduleRecord'))

        # ============================================
        # 类别3: 报告滞留 (report_stalled)
        # ============================================
        self.stdout.write('Creating 报告滞留 records...')
        for i in range(2):
            patient = patients[i]
            exam = exam_types_list[2 + i]
            appt_time = base_time + timedelta(days=-10 - i, hours=10)
            
            apt = Appointment.objects.create(
                appointment_no=f'APT-STALLED-{i+1:03d}',
                patient=patient,
                examination_type=exam,
                original_appointment_time=appt_time,
                current_appointment_time=appt_time,
                status=AppointmentStatus.COMPLETED,
                report_status=ReportStatus.STALLED,
                room=f'ROOM-{i+7:02d}',
                check_in_time=appt_time + timedelta(minutes=-3),
                completion_time=appt_time + timedelta(minutes=exam.estimated_duration),
                notes=f'{exam.name}报告已生成超过7天未领取',
                created_by=admin_user,
            )
            
            AbnormalRecord.objects.create(
                appointment=apt,
                abnormal_type='report_stalled',
                description=f'{exam.name}报告生成已超过7天，患者尚未领取。多次电话联系无人接听。建议进一步联系患者或按规定处理滞留报告。',
                status='open',
                handler=None,
                solution='',
                review_summary='',
                preventive_measures=''
            )
            
            OperationLog.objects.create(
                appointment=apt,
                operation_type='create',
                operator=admin_user,
                details=f'创建预约：{apt.appointment_no}',
                evidence='系统自动创建'
            )
            OperationLog.objects.create(
                appointment=apt,
                operation_type='abnormal',
                operator=operator_user,
                details='系统检测到报告滞留超过7天，已创建异常记录',
                evidence='报告生成日期：2024-05-25，当前已12天未领取'
            )
        self.stdout.write(self.style.SUCCESS('  Created 2 报告滞留 records with AbnormalRecord'))

        # ============================================
        # 类别4: 身份信息不匹配 (identity_mismatch)
        # ============================================
        self.stdout.write('Creating 身份信息不匹配 records...')
        for i in range(2):
            patient = patients[2 + i]
            exam = exam_types_list[0 + i]
            appt_time = base_time + timedelta(days=-3 - i, hours=14)
            
            apt = Appointment.objects.create(
                appointment_no=f'APT-MISMATCH-{i+1:03d}',
                patient=patient,
                examination_type=exam,
                original_appointment_time=appt_time,
                current_appointment_time=appt_time,
                status=AppointmentStatus.COMPLETED,
                report_status=ReportStatus.READY,
                room=f'ROOM-{i+9:02d}',
                check_in_time=appt_time + timedelta(minutes=-8),
                completion_time=appt_time + timedelta(minutes=exam.estimated_duration),
                notes=f'{exam.name}报告领取时身份不匹配，已阻断',
                created_by=admin_user,
            )
            
            wrong_name = '刘某某' if i == 0 else '陈某某'
            wrong_id = '110101199000000000'
            
            claim = ReportClaimRecord.objects.create(
                appointment=apt,
                claim_type='self',
                claimant_name=wrong_name,
                claimant_id_card=wrong_id,
                claimant_phone='13900139000',
                verification_result='mismatch',
                verification_notes=f'身份验证失败：领取人姓名"{wrong_name}"与患者姓名"{patient.name}"不匹配，身份证号"{wrong_id}"与系统记录"{patient.id_card}"不匹配。已按规定阻断领取。',
                correction_path=f"""1. 请患者本人携带有效身份证件原件到门诊服务台办理身份核验
2. 患者本人：{patient.name}，身份证号：{patient.id_card}
3. 如委托他人领取，请提供：
   - 患者本人身份证原件
   - 受托人身份证原件
   - 患者签署的授权委托书
4. 联系电话：400-XXX-XXXX
5. 工作时间：周一至周五 8:00-17:30""",
                is_blocked=True,
                operator=operator_user,
                reviewer=None,
                review_status='pending',
                review_notes='',
                evidence='领取人无法提供与系统一致的身份证明，照片比对不通过',
                claimed_at=None,
            )
            
            AbnormalRecord.objects.create(
                appointment=apt,
                abnormal_type='identity_mismatch',
                description=f'报告领取时身份验证失败：领取人"{wrong_name}"(身份证：{wrong_id})与系统记录患者"{patient.name}"(身份证：{patient.id_card})信息不匹配，已按规定阻断领取流程。需要进一步核实处理。',
                status='open',
                handler=None,
                solution='',
                review_summary='',
                preventive_measures=''
            )
            
            OperationLog.objects.create(
                appointment=apt,
                operation_type='create',
                operator=admin_user,
                details=f'创建预约：{apt.appointment_no}',
                evidence='系统自动创建'
            )
            OperationLog.objects.create(
                appointment=apt,
                operation_type='claim',
                operator=operator_user,
                details=f'身份验证失败，领取被阻断，领取人：{wrong_name}',
                evidence='姓名、身份证号均不匹配，已拒绝领取并告知补正路径'
            )
            OperationLog.objects.create(
                appointment=apt,
                operation_type='abnormal',
                operator=operator_user,
                details='身份信息不匹配异常记录已创建，待复核处理',
                evidence='已创建异常记录，等待后续处理'
            )
        self.stdout.write(self.style.SUCCESS('  Created 2 身份不匹配 records with ReportClaimRecord and AbnormalRecord'))

        # ============================================
        # 附加：创建一条已领取待复核的记录
        # ============================================
        patient = patients[5]
        exam = exam_types_list[5]
        appt_time = base_time + timedelta(days=-2, hours=15)
        
        apt = Appointment.objects.create(
            appointment_no='APT-PENDING-001',
            patient=patient,
            examination_type=exam,
            original_appointment_time=appt_time,
            current_appointment_time=appt_time,
            status=AppointmentStatus.COMPLETED,
            report_status=ReportStatus.CLAIMED,
            room='ROOM-11',
            check_in_time=appt_time + timedelta(minutes=-2),
            completion_time=appt_time + timedelta(minutes=exam.estimated_duration),
            notes=f'{exam.name}报告已领取，待复核',
            created_by=admin_user,
        )
        
        ReportClaimRecord.objects.create(
            appointment=apt,
            claim_type='authorized',
            claimant_name='周代理',
            claimant_id_card='110101199002022222',
            claimant_phone='13700137000',
            verification_result='match',
            verification_notes='授权领取，已核验双方身份证原件及授权委托书',
            is_blocked=False,
            operator=operator_user,
            reviewer=None,
            review_status='pending',
            review_notes='',
            evidence='患者及受托人身份证原件核验，授权委托书已留存',
            claimed_at=timezone.now() - timedelta(hours=2),
        )
        
        OperationLog.objects.create(
            appointment=apt,
            operation_type='create',
            operator=admin_user,
            details=f'创建预约：{apt.appointment_no}',
            evidence='系统自动创建'
        )
        OperationLog.objects.create(
            appointment=apt,
            operation_type='claim',
            operator=operator_user,
            details='报告领取成功（授权领取），待复核',
            evidence='资料齐全，身份核验通过'
        )
        self.stdout.write(self.style.SUCCESS('  Created 1 pending review record'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('Sample data initialization complete!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write('')
        self.stdout.write('Generated records summary:')
        self.stdout.write(f'  按时检查 (On Time): {Appointment.objects.filter(status=AppointmentStatus.COMPLETED).exclude(current_appointment_time__gt=F("original_appointment_time")).count()} records')
        self.stdout.write(f'  患者改期 (Rescheduled): {RescheduleRecord.objects.count()} records')
        self.stdout.write(f'  报告滞留 (Stalled): {AbnormalRecord.objects.filter(abnormal_type="report_stalled").count()} records')
        self.stdout.write(f'  身份不匹配 (Mismatch): {AbnormalRecord.objects.filter(abnormal_type="identity_mismatch").count()} records')
        self.stdout.write(f'  Total Appointments: {Appointment.objects.count()}')
        self.stdout.write(f'  Total RescheduleRecords: {RescheduleRecord.objects.count()}')
        self.stdout.write(f'  Total ReportClaimRecords: {ReportClaimRecord.objects.count()}')
        self.stdout.write(f'  Total AbnormalRecords: {AbnormalRecord.objects.count()}')
        self.stdout.write(f'  Total OperationLogs: {OperationLog.objects.count()}')
        self.stdout.write('')
        self.stdout.write('Test accounts:')
        self.stdout.write('  admin / admin123 (超级管理员)')
        self.stdout.write('  operator / operator123 (经办人)')
        self.stdout.write('  reviewer / reviewer123 (复核人)')
        self.stdout.write('')
        self.stdout.write('Access URLs:')
        self.stdout.write('  Workstation: http://localhost:8000/')
        self.stdout.write('  Notifications: http://localhost:8000/notifications/')
        self.stdout.write('  Review: http://localhost:8000/review/')
        self.stdout.write('  Admin: http://localhost:8000/admin/')
