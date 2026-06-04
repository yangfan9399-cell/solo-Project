from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from workstation.models import (
    ExaminationType, Patient, Appointment,
    AppointmentStatus, ReportStatus
)


class Command(BaseCommand):
    help = 'Initialize sample data for the clinic system'

    def handle(self, *args, **options):
        self.stdout.write('Creating sample data...')

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

        admin_user = User.objects.get(username='admin')
        patients = list(Patient.objects.all()[:5])
        exam_types_list = list(ExaminationType.objects.all()[:6])

        base_time = timezone.now().replace(hour=8, minute=0, second=0, microsecond=0)

        appointments_data = [
            {
                'no': 'APT20240601001',
                'patient': patients[0],
                'exam_type': exam_types_list[0],
                'time_offset': 0,
                'status': AppointmentStatus.COMPLETED,
                'report_status': ReportStatus.READY,
                'room': 'CT-01',
            },
            {
                'no': 'APT20240601002',
                'patient': patients[1],
                'exam_type': exam_types_list[1],
                'time_offset': 1,
                'status': AppointmentStatus.RESCHEDULED,
                'report_status': ReportStatus.PENDING,
                'room': 'MRI-01',
            },
            {
                'no': 'APT20240601003',
                'patient': patients[2],
                'exam_type': exam_types_list[2],
                'time_offset': 2,
                'status': AppointmentStatus.COMPLETED,
                'report_status': ReportStatus.STALLED,
                'room': 'US-01',
            },
            {
                'no': 'APT20240601004',
                'patient': patients[3],
                'exam_type': exam_types_list[3],
                'time_offset': 3,
                'status': AppointmentStatus.SCHEDULED,
                'report_status': ReportStatus.PENDING,
                'room': 'ECG-01',
            },
            {
                'no': 'APT20240601005',
                'patient': patients[4],
                'exam_type': exam_types_list[4],
                'time_offset': -1,
                'status': AppointmentStatus.COMPLETED,
                'report_status': ReportStatus.CLAIMED,
                'room': 'LAB-01',
            },
            {
                'no': 'APT20240601006',
                'patient': patients[0],
                'exam_type': exam_types_list[5],
                'time_offset': 4,
                'status': AppointmentStatus.SCHEDULED,
                'report_status': ReportStatus.PENDING,
                'room': 'XR-01',
            },
        ]

        for apt_data in appointments_data:
            appt_time = base_time + timedelta(days=apt_data['time_offset'])
            Appointment.objects.get_or_create(
                appointment_no=apt_data['no'],
                defaults={
                    'patient': apt_data['patient'],
                    'examination_type': apt_data['exam_type'],
                    'original_appointment_time': appt_time,
                    'current_appointment_time': appt_time + (timedelta(days=1) if apt_data['status'] == AppointmentStatus.RESCHEDULED else timedelta(0)),
                    'status': apt_data['status'],
                    'report_status': apt_data['report_status'],
                    'room': apt_data['room'],
                    'created_by': admin_user,
                }
            )

        self.stdout.write(self.style.SUCCESS('Created sample appointments'))
        self.stdout.write(self.style.SUCCESS('Sample data initialization complete!'))
