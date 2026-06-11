import uuid
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone

from training.models import (
    User, Role, Department, EmployeeProfile, Course,
    TrainingSchedule, Enrollment, EnrollmentStatus,
    Attendance, AttendanceStatus, Exam, ExamStatus, FailureReason,
    Certificate, CertificateStatus, CertificateHistory
)


class Command(BaseCommand):
    help = 'Seed database with sample data'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Reset all data before seeding')

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('Resetting all data...'))
            CertificateHistory.objects.all().delete()
            Certificate.objects.all().delete()
            Exam.objects.all().delete()
            Attendance.objects.all().delete()
            Enrollment.objects.all().delete()
            TrainingSchedule.objects.all().delete()
            Course.objects.all().delete()
            EmployeeProfile.objects.all().delete()
            User.objects.filter(is_staff=False).delete()
            Department.objects.all().delete()

        self.stdout.write('Seeding data...')
        self._create_departments()
        self._create_users()
        self._create_courses()
        self._create_schedules()
        self._create_enrollments()
        self._create_attendances()
        self._create_exams()
        self._create_certificates()
        self.stdout.write(self.style.SUCCESS('Data seeded successfully!'))

    def _create_departments(self):
        dept_names = ['技术研发部', '产品运营部', '市场销售部', '人力资源部', '财务部']
        for name in dept_names:
            Department.objects.get_or_create(name=name)
        self.stdout.write('  Departments created.')

    def _create_users(self):
        password = make_password('test123456')

        training_admin, _ = User.objects.get_or_create(
            username='admin_train',
            defaults={
                'first_name': '培训',
                'last_name': '管理员',
                'email': 'training@example.com',
                'role': Role.TRAINING_ADMIN,
                'password': password,
                'is_staff': True,
            }
        )

        hr, _ = User.objects.get_or_create(
            username='hr1',
            defaults={
                'first_name': '李',
                'last_name': 'HR',
                'email': 'hr@example.com',
                'role': Role.HR,
                'password': password,
                'is_staff': True,
            }
        )

        instructor1, _ = User.objects.get_or_create(
            username='instructor1',
            defaults={
                'first_name': '张',
                'last_name': '讲师',
                'email': 'instructor1@example.com',
                'role': Role.INSTRUCTOR,
                'password': password,
                'is_staff': False,
            }
        )

        instructor2, _ = User.objects.get_or_create(
            username='instructor2',
            defaults={
                'first_name': '王',
                'last_name': '讲师',
                'email': 'instructor2@example.com',
                'role': Role.INSTRUCTOR,
                'password': password,
                'is_staff': False,
            }
        )

        employees = [
            {'username': 'employee1', 'first_name': '陈', 'last_name': '小明', 'dept': '技术研发部', 'position': '软件工程师'},
            {'username': 'employee2', 'first_name': '刘', 'last_name': '小华', 'dept': '技术研发部', 'position': '测试工程师'},
            {'username': 'employee3', 'first_name': '周', 'last_name': '小芳', 'dept': '产品运营部', 'position': '产品经理'},
            {'username': 'employee4', 'first_name': '吴', 'last_name': '小伟', 'dept': '市场销售部', 'position': '销售经理'},
            {'username': 'employee5', 'first_name': '郑', 'last_name': '小丽', 'dept': '财务部', 'position': '会计'},
            {'username': 'employee6', 'first_name': '孙', 'last_name': '小强', 'dept': '技术研发部', 'position': '前端工程师'},
            {'username': 'employee7', 'first_name': '钱', 'last_name': '小美', 'dept': '产品运营部', 'position': '运营专员'},
            {'username': 'employee8', 'first_name': '赵', 'last_name': '小军', 'dept': '市场销售部', 'position': '销售代表'},
        ]

        for emp in employees:
            dept = Department.objects.get(name=emp['dept'])
            user, created = User.objects.get_or_create(
                username=emp['username'],
                defaults={
                    'first_name': emp['first_name'],
                    'last_name': emp['last_name'],
                    'email': f"{emp['username']}@example.com",
                    'role': Role.EMPLOYEE,
                    'password': password,
                }
            )
            if created:
                EmployeeProfile.objects.create(
                    user=user,
                    department=dept,
                    employee_id=f'EMP{uuid.uuid4().hex[:6].upper()}',
                    position=emp['position'],
                    hire_date=date(2023, 1, 15),
                )

        self.stdout.write('  Users and profiles created.')

    def _create_courses(self):
        courses_data = [
            {'name': 'Python 编程基础', 'duration': 16, 'pass_score': 60, 'desc': '从零开始学习 Python 编程语言，掌握基础语法和常用库。'},
            {'name': '项目管理实战', 'duration': 24, 'pass_score': 70, 'desc': '学习项目管理方法论，提升项目管理能力。'},
            {'name': '沟通技巧培训', 'duration': 8, 'pass_score': 60, 'desc': '提升职场沟通能力，学习有效表达和倾听技巧。'},
            {'name': '数据分析入门', 'duration': 32, 'pass_score': 65, 'desc': '学习数据分析基础知识和工具使用。'},
            {'name': '信息安全意识', 'duration': 4, 'pass_score': 80, 'desc': '提升信息安全意识，了解常见安全风险和防范措施。'},
        ]

        for course_data in courses_data:
            Course.objects.get_or_create(
                name=course_data['name'],
                defaults={
                    'description': course_data['desc'],
                    'duration_hours': course_data['duration'],
                    'pass_score': course_data['pass_score'],
                    'is_active': True,
                }
            )

        self.stdout.write('  Courses created.')

    def _create_schedules(self):
        instructor1 = User.objects.get(username='instructor1')
        instructor2 = User.objects.get(username='instructor2')

        today = date.today()

        schedules_data = [
            {
                'course': 'Python 编程基础',
                'instructor': instructor1,
                'start_date': today - timedelta(days=30),
                'end_date': today - timedelta(days=26),
                'location': '培训室A',
                'max_students': 20,
            },
            {
                'course': '项目管理实战',
                'instructor': instructor2,
                'start_date': today - timedelta(days=20),
                'end_date': today - timedelta(days=17),
                'location': '培训室B',
                'max_students': 15,
            },
            {
                'course': '沟通技巧培训',
                'instructor': instructor1,
                'start_date': today - timedelta(days=10),
                'end_date': today - timedelta(days=9),
                'location': '线上会议',
                'max_students': 30,
            },
            {
                'course': '数据分析入门',
                'instructor': instructor2,
                'start_date': today + timedelta(days=5),
                'end_date': today + timedelta(days=12),
                'location': '培训室A',
                'max_students': 20,
            },
            {
                'course': '信息安全意识',
                'instructor': instructor1,
                'start_date': today + timedelta(days=15),
                'end_date': today + timedelta(days=15),
                'location': '线上会议',
                'max_students': 50,
            },
        ]

        for sched_data in schedules_data:
            course = Course.objects.get(name=sched_data['course'])
            TrainingSchedule.objects.get_or_create(
                course=course,
                start_date=sched_data['start_date'],
                defaults={
                    'instructor': sched_data['instructor'],
                    'end_date': sched_data['end_date'],
                    'location': sched_data['location'],
                    'max_students': sched_data['max_students'],
                    'is_active': True,
                }
            )

        self.stdout.write('  Schedules created.')

    def _create_enrollments(self):
        training_admin = User.objects.get(username='admin_train')

        employee1 = User.objects.get(username='employee1')
        employee2 = User.objects.get(username='employee2')
        employee3 = User.objects.get(username='employee3')
        employee4 = User.objects.get(username='employee4')
        employee5 = User.objects.get(username='employee5')
        employee6 = User.objects.get(username='employee6')
        employee7 = User.objects.get(username='employee7')
        employee8 = User.objects.get(username='employee8')

        schedule_python = TrainingSchedule.objects.get(course__name='Python 编程基础')
        schedule_pm = TrainingSchedule.objects.get(course__name='项目管理实战')
        schedule_comm = TrainingSchedule.objects.get(course__name='沟通技巧培训')
        schedule_data = TrainingSchedule.objects.get(course__name='数据分析入门')
        schedule_security = TrainingSchedule.objects.get(course__name='信息安全意识')

        enrollments_data = [
            {'employee': employee1, 'schedule': schedule_python, 'status': EnrollmentStatus.APPROVED},
            {'employee': employee2, 'schedule': schedule_python, 'status': EnrollmentStatus.APPROVED},
            {'employee': employee6, 'schedule': schedule_python, 'status': EnrollmentStatus.APPROVED},
            {'employee': employee3, 'schedule': schedule_pm, 'status': EnrollmentStatus.APPROVED},
            {'employee': employee4, 'schedule': schedule_pm, 'status': EnrollmentStatus.APPROVED},
            {'employee': employee7, 'schedule': schedule_comm, 'status': EnrollmentStatus.APPROVED},
            {'employee': employee8, 'schedule': schedule_comm, 'status': EnrollmentStatus.APPROVED},
            {'employee': employee5, 'schedule': schedule_data, 'status': EnrollmentStatus.PENDING},
            {'employee': employee1, 'schedule': schedule_data, 'status': EnrollmentStatus.APPROVED},
            {'employee': employee3, 'schedule': schedule_security, 'status': EnrollmentStatus.PENDING},
        ]

        for enr_data in enrollments_data:
            enrollment, created = Enrollment.objects.get_or_create(
                employee=enr_data['employee'],
                schedule=enr_data['schedule'],
                defaults={
                    'status': enr_data['status'],
                    'approved_at': timezone.now() if enr_data['status'] == EnrollmentStatus.APPROVED else None,
                    'approved_by': training_admin if enr_data['status'] == EnrollmentStatus.APPROVED else None,
                }
            )
            if created and enrollment.status == EnrollmentStatus.APPROVED:
                Exam.objects.get_or_create(enrollment=enrollment)
                self._generate_certificate(enrollment)
                self._generate_attendances(enrollment)

        self.stdout.write('  Enrollments created.')

    def _generate_certificate(self, enrollment):
        cert_no = f'CERT-{enrollment.schedule.start_date.strftime("%Y%m%d")}-{uuid.uuid4().hex[:6].upper()}'
        Certificate.objects.get_or_create(
            enrollment=enrollment,
            defaults={
                'certificate_no': cert_no,
                'status': CertificateStatus.PENDING,
            }
        )

    def _generate_attendances(self, enrollment):
        schedule = enrollment.schedule
        current = schedule.start_date
        while current <= schedule.end_date:
            Attendance.objects.get_or_create(
                enrollment=enrollment,
                check_date=current,
                defaults={'status': AttendanceStatus.NOT_CHECKED}
            )
            current += timedelta(days=1)

    def _create_attendances(self):
        instructor1 = User.objects.get(username='instructor1')
        instructor2 = User.objects.get(username='instructor2')

        employee1 = User.objects.get(username='employee1')
        employee2 = User.objects.get(username='employee2')
        employee6 = User.objects.get(username='employee6')

        schedule_python = TrainingSchedule.objects.get(course__name='Python 编程基础')

        enrollments_python = Enrollment.objects.filter(schedule=schedule_python)

        for enrollment in enrollments_python:
            attendances = Attendance.objects.filter(enrollment=enrollment)
            for i, att in enumerate(attendances):
                att.checked_by = instructor1
                att.check_in_time = timezone.make_aware(
                    timezone.datetime.combine(att.check_date, timezone.datetime.min.time()) + timedelta(hours=9)
                )

                if enrollment.employee.username == 'employee2':
                    if i == 1:
                        att.status = AttendanceStatus.ABSENT
                    elif i == 2:
                        att.status = AttendanceStatus.LATE
                    else:
                        att.status = AttendanceStatus.PRESENT
                elif enrollment.employee.username == 'employee6':
                    if i in [1, 2, 3]:
                        att.status = AttendanceStatus.ABSENT
                    else:
                        att.status = AttendanceStatus.PRESENT
                else:
                    att.status = AttendanceStatus.PRESENT

                att.save()

        schedule_comm = TrainingSchedule.objects.get(course__name='沟通技巧培训')
        enrollments_comm = Enrollment.objects.filter(schedule=schedule_comm)
        for enrollment in enrollments_comm:
            attendances = Attendance.objects.filter(enrollment=enrollment)
            for att in attendances:
                att.status = AttendanceStatus.PRESENT
                att.checked_by = instructor1
                att.check_in_time = timezone.make_aware(
                    timezone.datetime.combine(att.check_date, timezone.datetime.min.time()) + timedelta(hours=9)
                )
                att.save()

        schedule_pm = TrainingSchedule.objects.get(course__name='项目管理实战')
        enrollments_pm = Enrollment.objects.filter(schedule=schedule_pm)
        for enrollment in enrollments_pm:
            attendances = Attendance.objects.filter(enrollment=enrollment)
            for att in attendances:
                att.status = AttendanceStatus.PRESENT
                att.checked_by = instructor2
                att.check_in_time = timezone.make_aware(
                    timezone.datetime.combine(att.check_date, timezone.datetime.min.time()) + timedelta(hours=9)
                )
                att.save()

        self.stdout.write('  Attendances created.')

    def _create_exams(self):
        instructor1 = User.objects.get(username='instructor1')
        instructor2 = User.objects.get(username='instructor2')

        schedule_python = TrainingSchedule.objects.get(course__name='Python 编程基础')
        enrollments_python = Enrollment.objects.filter(schedule=schedule_python)

        for enrollment in enrollments_python:
            exam, _ = Exam.objects.get_or_create(enrollment=enrollment)
            exam.exam_date = schedule_python.end_date + timedelta(days=1)
            exam.confirmed_by = instructor1
            exam.confirmed_at = timezone.now()

            if enrollment.employee.username == 'employee1':
                exam.score = 85
                exam.status = ExamStatus.PASSED
                exam.failure_reason = None
            elif enrollment.employee.username == 'employee2':
                exam.score = 72
                exam.status = ExamStatus.PASSED
                exam.failure_reason = None
            elif enrollment.employee.username == 'employee6':
                exam.score = 45
                exam.status = ExamStatus.FAILED
                exam.failure_reason = FailureReason.SCORE_TOO_LOW

            exam.save()

        schedule_comm = TrainingSchedule.objects.get(course__name='沟通技巧培训')
        enrollments_comm = Enrollment.objects.filter(schedule=schedule_comm)
        for enrollment in enrollments_comm:
            exam, _ = Exam.objects.get_or_create(enrollment=enrollment)
            exam.score = 88
            exam.status = ExamStatus.PASSED
            exam.failure_reason = None
            exam.exam_date = schedule_comm.end_date + timedelta(days=1)
            exam.confirmed_by = instructor1
            exam.confirmed_at = timezone.now()
            exam.save()

        schedule_pm = TrainingSchedule.objects.get(course__name='项目管理实战')
        enrollments_pm = Enrollment.objects.filter(schedule=schedule_pm)
        for enrollment in enrollments_pm:
            exam, _ = Exam.objects.get_or_create(enrollment=enrollment)
            exam.exam_date = schedule_pm.end_date + timedelta(days=2)
            exam.confirmed_by = instructor2
            exam.confirmed_at = timezone.now()

            if enrollment.employee.username == 'employee3':
                exam.score = 90
                exam.status = ExamStatus.PASSED
            elif enrollment.employee.username == 'employee4':
                exam.score = 65
                exam.status = ExamStatus.FAILED
                exam.failure_reason = FailureReason.SCORE_TOO_LOW

            exam.save()

        self.stdout.write('  Exams created.')

    def _create_certificates(self):
        hr_user = User.objects.get(username='hr1')

        schedule_python = TrainingSchedule.objects.get(course__name='Python 编程基础')
        schedule_comm = TrainingSchedule.objects.get(course__name='沟通技巧培训')
        schedule_pm = TrainingSchedule.objects.get(course__name='项目管理实战')

        employee1 = User.objects.get(username='employee1')
        employee2 = User.objects.get(username='employee2')
        employee7 = User.objects.get(username='employee7')
        employee8 = User.objects.get(username='employee8')
        employee3 = User.objects.get(username='employee3')
        employee4 = User.objects.get(username='employee4')

        cert1 = Certificate.objects.get(
            enrollment__employee=employee1,
            enrollment__schedule=schedule_python
        )
        cert1.status = CertificateStatus.ISSUED
        cert1.issued_date = schedule_python.end_date + timedelta(days=3)
        cert1.issued_by = hr_user
        cert1.save()
        CertificateHistory.objects.create(
            certificate=cert1,
            action='发放证书',
            operator=hr_user,
            remark='考试通过，正常发证'
        )

        cert2 = Certificate.objects.get(
            enrollment__employee=employee2,
            enrollment__schedule=schedule_python
        )
        cert2.status = CertificateStatus.ISSUED
        cert2.issued_date = schedule_python.end_date + timedelta(days=3)
        cert2.issued_by = hr_user
        cert2.save()
        CertificateHistory.objects.create(
            certificate=cert2,
            action='发放证书',
            operator=hr_user,
            remark='考试通过，正常发证'
        )

        cert3 = Certificate.objects.get(
            enrollment__employee=employee7,
            enrollment__schedule=schedule_comm
        )
        cert3.status = CertificateStatus.ISSUED
        cert3.issued_date = schedule_comm.end_date + timedelta(days=2)
        cert3.issued_by = hr_user
        cert3.save()
        CertificateHistory.objects.create(
            certificate=cert3,
            action='发放证书',
            operator=hr_user,
            remark='考试通过，正常发证'
        )

        cert4 = Certificate.objects.get(
            enrollment__employee=employee8,
            enrollment__schedule=schedule_comm
        )
        cert4.status = CertificateStatus.REVOKED
        cert4.issued_date = schedule_comm.end_date + timedelta(days=2)
        cert4.issued_by = hr_user
        cert4.revoked_date = schedule_comm.end_date + timedelta(days=10)
        cert4.revoked_by = hr_user
        cert4.revoke_reason = '后续发现考试作弊，撤回证书'
        cert4.save()
        CertificateHistory.objects.create(
            certificate=cert4,
            action='发放证书',
            operator=hr_user,
            remark='考试通过，正常发证'
        )
        CertificateHistory.objects.create(
            certificate=cert4,
            action='撤回证书',
            operator=hr_user,
            remark='后续发现考试作弊，撤回证书'
        )

        cert5 = Certificate.objects.get(
            enrollment__employee=employee3,
            enrollment__schedule=schedule_pm
        )
        cert5.status = CertificateStatus.ISSUED
        cert5.issued_date = schedule_pm.end_date + timedelta(days=5)
        cert5.issued_by = hr_user
        cert5.save()
        CertificateHistory.objects.create(
            certificate=cert5,
            action='发放证书',
            operator=hr_user,
            remark='考试通过，正常发证'
        )

        self.stdout.write('  Certificates created.')
        self.stdout.write('  Sample scenarios:')
        self.stdout.write('    1. 正常发证: employee1 (Python), employee2 (Python), employee3 (PM), employee7 (沟通)')
        self.stdout.write('    2. 缺勤较多: employee6 (Python) - 缺勤3天，未通过考试')
        self.stdout.write('    3. 考试未通过: employee4 (PM), employee6 (Python)')
        self.stdout.write('    4. 证书撤回: employee8 (沟通) - 已发证后撤回')
