import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.db.models import Count, Avg, F
from django.db.models.functions import TruncMonth


class Role(models.TextChoices):
    EMPLOYEE = 'employee', '员工'
    TRAINING_ADMIN = 'training_admin', '培训管理员'
    INSTRUCTOR = 'instructor', '讲师'
    HR = 'hr', 'HR'


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.get_full_name() or self.username}'


class Department(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='部门名称')
    description = models.TextField(blank=True, verbose_name='部门描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '部门'
        verbose_name_plural = verbose_name
        ordering = ['name']

    def __str__(self):
        return self.name


class EmployeeProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name='用户')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees', verbose_name='部门')
    employee_id = models.CharField(max_length=50, unique=True, verbose_name='工号')
    position = models.CharField(max_length=100, blank=True, verbose_name='职位')
    hire_date = models.DateField(null=True, blank=True, verbose_name='入职日期')

    class Meta:
        verbose_name = '员工档案'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.employee_id} - {self.user.get_full_name()}'


class Course(models.Model):
    name = models.CharField(max_length=200, verbose_name='课程名称')
    description = models.TextField(blank=True, verbose_name='课程描述')
    duration_hours = models.PositiveIntegerField(default=8, verbose_name='课时（小时）')
    pass_score = models.PositiveIntegerField(default=60, verbose_name='及格分数')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '课程'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class TrainingSchedule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='schedules', verbose_name='课程')
    instructor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='teaching_schedules', verbose_name='讲师', limit_choices_to={'role': Role.INSTRUCTOR})
    start_date = models.DateField(verbose_name='开始日期')
    end_date = models.DateField(verbose_name='结束日期')
    location = models.CharField(max_length=200, blank=True, verbose_name='培训地点')
    max_students = models.PositiveIntegerField(default=30, verbose_name='最大人数')
    is_active = models.BooleanField(default=True, verbose_name='是否有效')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '培训排班'
        verbose_name_plural = verbose_name
        ordering = ['-start_date']

    def __str__(self):
        return f'{self.course.name} ({self.start_date} ~ {self.end_date})'

    def enrolled_count(self):
        return self.enrollments.filter(status=EnrollmentStatus.APPROVED).count()


class EnrollmentStatus(models.TextChoices):
    PENDING = 'pending', '待审核'
    APPROVED = 'approved', '已通过'
    REJECTED = 'rejected', '已拒绝'
    CANCELLED = 'cancelled', '已取消'


class Enrollment(models.Model):
    schedule = models.ForeignKey(TrainingSchedule, on_delete=models.CASCADE, related_name='enrollments', verbose_name='培训排班')
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments', verbose_name='员工', limit_choices_to={'role': Role.EMPLOYEE})
    status = models.CharField(max_length=20, choices=EnrollmentStatus.choices, default=EnrollmentStatus.PENDING, verbose_name='报名状态')
    applied_at = models.DateTimeField(auto_now_add=True, verbose_name='报名时间')
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='审核时间')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_enrollments', verbose_name='审核人')
    remark = models.CharField(max_length=500, blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '报名记录'
        verbose_name_plural = verbose_name
        unique_together = ['schedule', 'employee']
        ordering = ['-applied_at']

    def __str__(self):
        return f'{self.employee} - {self.schedule.course.name}'


class AttendanceStatus(models.TextChoices):
    PRESENT = 'present', '已签到'
    ABSENT = 'absent', '缺勤'
    LATE = 'late', '迟到'
    NOT_CHECKED = 'not_checked', '未签到'


class Attendance(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE, related_name='attendances', verbose_name='报名记录')
    check_date = models.DateField(verbose_name='签到日期')
    status = models.CharField(max_length=20, choices=AttendanceStatus.choices, default=AttendanceStatus.NOT_CHECKED, verbose_name='签到状态')
    check_in_time = models.DateTimeField(null=True, blank=True, verbose_name='签到时间')
    checked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='checked_attendances', verbose_name='确认人')
    remark = models.CharField(max_length=500, blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '签到记录'
        verbose_name_plural = verbose_name
        unique_together = ['enrollment', 'check_date']
        ordering = ['-check_date']

    def __str__(self):
        return f'{self.enrollment.employee} - {self.check_date} ({self.get_status_display()})'


class ExamStatus(models.TextChoices):
    NOT_TAKEN = 'not_taken', '未考试'
    PASSED = 'passed', '已通过'
    FAILED = 'failed', '未通过'


class FailureReason(models.TextChoices):
    SCORE_TOO_LOW = 'score_too_low', '分数不足'
    ABSENT_TOO_MUCH = 'absent_too_much', '缺勤过多'
    CHEATING = 'cheating', '作弊'
    OTHER = 'other', '其他'


class Exam(models.Model):
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='exam', verbose_name='报名记录')
    score = models.PositiveIntegerField(null=True, blank=True, verbose_name='考试分数')
    status = models.CharField(max_length=20, choices=ExamStatus.choices, default=ExamStatus.NOT_TAKEN, verbose_name='考试状态')
    failure_reason = models.CharField(max_length=50, choices=FailureReason.choices, null=True, blank=True, verbose_name='未通过原因')
    exam_date = models.DateField(null=True, blank=True, verbose_name='考试日期')
    confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='confirmed_exams', verbose_name='确认人')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    remark = models.CharField(max_length=500, blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '考试成绩'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.enrollment.employee} - {self.enrollment.schedule.course.name}'

    def save(self, *args, **kwargs):
        if self.score is not None and self.status == ExamStatus.NOT_TAKEN:
            course = self.enrollment.schedule.course
            if self.score >= course.pass_score:
                self.status = ExamStatus.PASSED
                self.failure_reason = None
            else:
                self.status = ExamStatus.FAILED
                if not self.failure_reason:
                    self.failure_reason = FailureReason.SCORE_TOO_LOW
        super().save(*args, **kwargs)


class CertificateStatus(models.TextChoices):
    PENDING = 'pending', '待发证'
    ISSUED = 'issued', '已发证'
    REVOKED = 'revoked', '已撤回'
    REJECTED = 'rejected', '发证驳回'


class Certificate(models.Model):
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='certificate', verbose_name='报名记录')
    certificate_no = models.CharField(max_length=50, unique=True, verbose_name='证书编号')
    status = models.CharField(max_length=20, choices=CertificateStatus.choices, default=CertificateStatus.PENDING, verbose_name='证书状态')
    issued_date = models.DateField(null=True, blank=True, verbose_name='发证日期')
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_certificates', verbose_name='发证HR')
    revoked_date = models.DateField(null=True, blank=True, verbose_name='撤回日期')
    revoked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='revoked_certificates', verbose_name='撤回人')
    revoke_reason = models.CharField(max_length=500, blank=True, verbose_name='撤回原因')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '证书'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.certificate_no} - {self.enrollment.employee}'

    def can_be_issued(self):
        if self.status != CertificateStatus.PENDING:
            return False
        try:
            exam = self.enrollment.exam
            if exam.status != ExamStatus.PASSED:
                return False
        except Exam.DoesNotExist:
            return False
        attendances = self.enrollment.attendances.all()
        if attendances.exists():
            absent_count = attendances.filter(status=AttendanceStatus.ABSENT).count()
            total_days = attendances.count()
            if total_days > 0 and absent_count / total_days > 0.2:
                return False
        return True


class CertificateHistory(models.Model):
    certificate = models.ForeignKey(Certificate, on_delete=models.CASCADE, related_name='histories', verbose_name='证书')
    action = models.CharField(max_length=50, verbose_name='操作')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='操作人')
    remark = models.CharField(max_length=500, blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        verbose_name = '证书历史记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.certificate.certificate_no} - {self.action}'


class TrainingAnalytics:
    @staticmethod
    def by_department():
        from training.models import Enrollment, Exam, CertificateStatus, ExamStatus
        results = []
        enrollments = Enrollment.objects.filter(status=EnrollmentStatus.APPROVED)
        dept_map = {}
        for e in enrollments:
            try:
                dept = e.employee.profile.department
                dept_name = dept.name if dept else '未分配'
            except EmployeeProfile.DoesNotExist:
                dept_name = '未分配'
            if dept_name not in dept_map:
                dept_map[dept_name] = {'total': 0, 'passed': 0, 'failed': 0, 'certified': 0}
            dept_map[dept_name]['total'] += 1
            try:
                exam = e.exam
                if exam.status == ExamStatus.PASSED:
                    dept_map[dept_name]['passed'] += 1
                elif exam.status == ExamStatus.FAILED:
                    dept_map[dept_name]['failed'] += 1
            except Exam.DoesNotExist:
                pass
            try:
                cert = e.certificate
                if cert.status == CertificateStatus.ISSUED:
                    dept_map[dept_name]['certified'] += 1
            except Certificate.DoesNotExist:
                pass
        for dept, data in dept_map.items():
            results.append({'department': dept, **data})
        return sorted(results, key=lambda x: x['total'], reverse=True)

    @staticmethod
    def by_course():
        from training.models import Enrollment, Exam, Certificate, CertificateStatus, ExamStatus
        courses = Course.objects.filter(is_active=True)
        results = []
        for course in courses:
            schedules = course.schedules.all()
            enrollments = Enrollment.objects.filter(schedule__in=schedules, status=EnrollmentStatus.APPROVED)
            total = enrollments.count()
            passed = Exam.objects.filter(enrollment__in=enrollments, status=ExamStatus.PASSED).count()
            failed = Exam.objects.filter(enrollment__in=enrollments, status=ExamStatus.FAILED).count()
            certified = Certificate.objects.filter(enrollment__in=enrollments, status=CertificateStatus.ISSUED).count()
            pass_rate = (passed / total * 100) if total > 0 else 0
            cert_rate = (certified / total * 100) if total > 0 else 0
            results.append({
                'course': course.name,
                'total': total,
                'passed': passed,
                'failed': failed,
                'certified': certified,
                'pass_rate': round(pass_rate, 1),
                'cert_rate': round(cert_rate, 1),
            })
        return sorted(results, key=lambda x: x['total'], reverse=True)

    @staticmethod
    def by_failure_reason():
        from training.models import Exam, FailureReason
        reasons = {}
        for choice in FailureReason.choices:
            reasons[choice[0]] = {'label': choice[1], 'count': 0}
        failed_exams = Exam.objects.filter(status=ExamStatus.FAILED)
        for exam in failed_exams:
            reason = exam.failure_reason or 'other'
            if reason in reasons:
                reasons[reason]['count'] += 1
            else:
                reasons['other']['count'] += 1
        return list(reasons.values())

    @staticmethod
    def certification_cycle():
        from training.models import Enrollment, Certificate, CertificateStatus, Exam
        issued_certs = Certificate.objects.filter(status=CertificateStatus.ISSUED)
        cycles = []
        for cert in issued_certs:
            enrollment = cert.enrollment
            start_date = enrollment.schedule.start_date
            issue_date = cert.issued_date
            if start_date and issue_date:
                days = (issue_date - start_date).days
                cycles.append(days)
        if not cycles:
            return {
                'avg_days': 0,
                'min_days': 0,
                'max_days': 0,
                'total': 0,
            }
        return {
            'avg_days': round(sum(cycles) / len(cycles), 1),
            'min_days': min(cycles),
            'max_days': max(cycles),
            'total': len(cycles),
        }
