import uuid
from datetime import timedelta
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import ListView, DetailView, View
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone
from django.db import transaction

from .models import (
    Course, TrainingSchedule, Enrollment, EnrollmentStatus,
    Attendance, AttendanceStatus, Exam, ExamStatus, FailureReason,
    Certificate, CertificateStatus, CertificateHistory,
    Department, Role, TrainingAnalytics
)


def is_employee(user):
    return user.role == Role.EMPLOYEE


def is_training_admin(user):
    return user.role == Role.TRAINING_ADMIN


def is_instructor(user):
    return user.role == Role.INSTRUCTOR


def is_hr(user):
    return user.role == Role.HR


class RoleRequiredMixin(UserPassesTestMixin):
    allowed_roles = []

    def test_func(self):
        return self.request.user.role in self.allowed_roles or self.request.user.is_staff


@login_required
def dashboard(request):
    user = request.user
    context = {}

    if user.role == Role.EMPLOYEE:
        my_enrollments = Enrollment.objects.filter(employee=user)
        context['my_enrollments'] = my_enrollments[:5]
        context['total_enrollments'] = my_enrollments.count()
        context['passed_exams'] = Exam.objects.filter(enrollment__employee=user, status=ExamStatus.PASSED).count()
        context['my_certificates'] = Certificate.objects.filter(enrollment__employee=user, status=CertificateStatus.ISSUED).count()
        context['active_courses'] = Course.objects.filter(is_active=True).count()
    elif user.role == Role.TRAINING_ADMIN:
        context['total_courses'] = Course.objects.count()
        context['active_schedules'] = TrainingSchedule.objects.filter(is_active=True).count()
        context['pending_enrollments'] = Enrollment.objects.filter(status=EnrollmentStatus.PENDING).count()
        context['total_enrollments'] = Enrollment.objects.count()
    elif user.role == Role.INSTRUCTOR:
        my_schedules = TrainingSchedule.objects.filter(instructor=user, is_active=True)
        context['my_schedules'] = my_schedules
        students_count = 0
        for s in my_schedules:
            students_count += s.enrolled_count()
        context['students_count'] = students_count
        context['pending_exams'] = Exam.objects.filter(
            enrollment__schedule__instructor=user,
            status=ExamStatus.NOT_TAKEN
        ).count()
    elif user.role == Role.HR:
        context['pending_certificates'] = Certificate.objects.filter(status=CertificateStatus.PENDING).count()
        context['issued_certificates'] = Certificate.objects.filter(status=CertificateStatus.ISSUED).count()
        context['revoked_certificates'] = Certificate.objects.filter(status=CertificateStatus.REVOKED).count()
        context['total_employees'] = 0

    return render(request, 'training/dashboard.html', context)


@login_required
def course_list(request):
    courses = Course.objects.filter(is_active=True)
    user = request.user
    enrolled_schedule_ids = []
    if user.role == Role.EMPLOYEE:
        enrolled_schedule_ids = list(
            Enrollment.objects.filter(employee=user).values_list('schedule_id', flat=True)
        )

    schedules = []
    for course in courses:
        active_schedules = course.schedules.filter(is_active=True)
        for s in active_schedules:
            schedules.append({
                'schedule': s,
                'course': course,
                'is_enrolled': s.id in enrolled_schedule_ids,
                'enrolled_count': s.enrolled_count(),
            })

    context = {
        'courses': courses,
        'schedules': schedules,
    }
    return render(request, 'training/course_list.html', context)


@login_required
def enroll_course(request, schedule_id):
    if request.user.role != Role.EMPLOYEE:
        messages.error(request, '只有员工可以报名课程')
        return redirect('course_list')

    schedule = get_object_or_404(TrainingSchedule, id=schedule_id, is_active=True)

    existing = Enrollment.objects.filter(schedule=schedule, employee=request.user).first()
    if existing:
        messages.warning(request, '您已经报名了此课程')
        return redirect('course_list')

    if schedule.enrolled_count() >= schedule.max_students:
        messages.error(request, '报名人数已满')
        return redirect('course_list')

    enrollment = Enrollment.objects.create(
        schedule=schedule,
        employee=request.user,
        status=EnrollmentStatus.PENDING,
    )

    messages.success(request, '报名成功，等待审核')
    return redirect('my_enrollments')


@login_required
def my_enrollments(request):
    if request.user.role != Role.EMPLOYEE:
        return redirect('dashboard')

    enrollments = Enrollment.objects.filter(employee=request.user).select_related(
        'schedule', 'schedule__course', 'schedule__instructor'
    ).prefetch_related('attendances', 'exam', 'certificate')

    context = {
        'enrollments': enrollments,
    }
    return render(request, 'training/my_enrollments.html', context)


@login_required
def enrollment_detail(request, enrollment_id):
    enrollment = get_object_or_404(Enrollment.objects.select_related(
        'employee', 'schedule', 'schedule__course', 'schedule__instructor'
    ).prefetch_related('attendances', 'exam', 'certificate', 'certificate__histories'), id=enrollment_id)

    user = request.user
    can_view = (
        user.role == Role.HR or
        user.role == Role.TRAINING_ADMIN or
        (user.role == Role.INSTRUCTOR and enrollment.schedule.instructor == user) or
        enrollment.employee == user
    )

    if not can_view:
        messages.error(request, '您没有权限查看此记录')
        return redirect('dashboard')

    try:
        profile = enrollment.employee.profile
    except Exception:
        profile = None

    certificate = None
    try:
        certificate = enrollment.certificate
    except Certificate.DoesNotExist:
        pass

    exam = None
    try:
        exam = enrollment.exam
    except Exam.DoesNotExist:
        pass

    attendances = enrollment.attendances.all()

    histories = []
    if certificate:
        histories = certificate.histories.all()

    timeline = []
    timeline.append({'time': enrollment.applied_at, 'event': '提交报名', 'actor': enrollment.employee})
    if enrollment.status == EnrollmentStatus.APPROVED and enrollment.approved_at:
        timeline.append({'time': enrollment.approved_at, 'event': '报名审核通过', 'actor': enrollment.approved_by})
    elif enrollment.status == EnrollmentStatus.REJECTED:
        timeline.append({'time': enrollment.approved_at, 'event': '报名被拒绝', 'actor': enrollment.approved_by})

    for att in attendances.order_by('check_date'):
        if att.status != AttendanceStatus.NOT_CHECKED:
            timeline.append({
                'time': att.check_in_time or timezone.make_aware(timezone.datetime.combine(att.check_date, timezone.datetime.min.time())),
                'event': f'签到: {att.get_status_display()}',
                'actor': att.checked_by
            })

    if exam and exam.status != ExamStatus.NOT_TAKEN:
        timeline.append({
            'time': exam.confirmed_at or timezone.make_aware(timezone.datetime.combine(exam.exam_date, timezone.datetime.min.time())) if exam.exam_date else None,
            'event': f'考试: {exam.get_status_display()} (分数: {exam.score})',
            'actor': exam.confirmed_by
        })

    if certificate:
        timeline.append({'time': certificate.created_at, 'event': '创建证书记录', 'actor': None})
        if certificate.status == CertificateStatus.ISSUED and certificate.issued_date:
            timeline.append({
                'time': timezone.make_aware(timezone.datetime.combine(certificate.issued_date, timezone.datetime.min.time())),
                'event': '证书已发放',
                'actor': certificate.issued_by
            })
        elif certificate.status == CertificateStatus.REVOKED and certificate.revoked_date:
            timeline.append({
                'time': timezone.make_aware(timezone.datetime.combine(certificate.revoked_date, timezone.datetime.min.time())),
                'event': f'证书已撤回: {certificate.revoke_reason}',
                'actor': certificate.revoked_by
            })

    timeline.sort(key=lambda x: x['time'] or timezone.datetime.min.replace(tzinfo=timezone.utc), reverse=True)

    context = {
        'enrollment': enrollment,
        'profile': profile,
        'certificate': certificate,
        'exam': exam,
        'attendances': attendances,
        'timeline': timeline,
        'histories': histories,
    }
    return render(request, 'training/enrollment_detail.html', context)


class TrainingAdminRequiredMixin(LoginRequiredMixin, RoleRequiredMixin):
    allowed_roles = [Role.TRAINING_ADMIN]


class EnrollmentApprovalView(LoginRequiredMixin, RoleRequiredMixin, View):
    allowed_roles = [Role.TRAINING_ADMIN]

    def post(self, request, enrollment_id, action):
        enrollment = get_object_or_404(Enrollment, id=enrollment_id)

        if action == 'approve':
            enrollment.status = EnrollmentStatus.APPROVED
            enrollment.approved_at = timezone.now()
            enrollment.approved_by = request.user
            messages.success(request, '报名已通过')
        elif action == 'reject':
            enrollment.status = EnrollmentStatus.REJECTED
            enrollment.approved_at = timezone.now()
            enrollment.approved_by = request.user
            enrollment.remark = request.POST.get('remark', '')
            messages.success(request, '报名已拒绝')
        else:
            messages.error(request, '无效操作')
            return redirect('enrollment_list')

        enrollment.save()

        if enrollment.status == EnrollmentStatus.APPROVED:
            Exam.objects.get_or_create(enrollment=enrollment)
            Certificate.objects.get_or_create(
                enrollment=enrollment,
                defaults={'certificate_no': generate_certificate_no()}
            )
            schedule = enrollment.schedule
            start = schedule.start_date
            end = schedule.end_date
            current = start
            while current <= end:
                Attendance.objects.get_or_create(
                    enrollment=enrollment,
                    check_date=current,
                )
                current += timedelta(days=1)

        if request.headers.get('HX-Request'):
            return render(request, 'training/partials/enrollment_status.html', {'enrollment': enrollment})

        return redirect('enrollment_list')


@login_required
def enrollment_list(request):
    if request.user.role not in [Role.TRAINING_ADMIN, Role.HR, Role.INSTRUCTOR]:
        return redirect('dashboard')

    status_filter = request.GET.get('status', '')
    enrollments = Enrollment.objects.all().select_related('employee', 'schedule', 'schedule__course')

    if status_filter:
        enrollments = enrollments.filter(status=status_filter)

    if request.user.role == Role.INSTRUCTOR:
        enrollments = enrollments.filter(schedule__instructor=request.user)

    context = {
        'enrollments': enrollments,
        'status_filter': status_filter,
        'EnrollmentStatus': EnrollmentStatus,
    }
    return render(request, 'training/enrollment_list.html', context)


class InstructorRequiredMixin(LoginRequiredMixin, RoleRequiredMixin):
    allowed_roles = [Role.INSTRUCTOR]


@login_required
def attendance_manage(request, schedule_id):
    if request.user.role != Role.INSTRUCTOR:
        return redirect('dashboard')

    schedule = get_object_or_404(TrainingSchedule, id=schedule_id, instructor=request.user)
    date_str = request.GET.get('date', '')
    check_date = None

    if date_str:
        from datetime import datetime
        try:
            check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            check_date = schedule.start_date
    else:
        check_date = schedule.start_date

    enrollments = Enrollment.objects.filter(
        schedule=schedule,
        status=EnrollmentStatus.APPROVED
    ).select_related('employee').prefetch_related('attendances')

    attendance_data = []
    for enrollment in enrollments:
        att, created = Attendance.objects.get_or_create(
            enrollment=enrollment,
            check_date=check_date,
        )
        attendance_data.append({
            'enrollment': enrollment,
            'attendance': att,
        })

    date_list = []
    current = schedule.start_date
    while current <= schedule.end_date:
        date_list.append(current)
        current += timedelta(days=1)

    context = {
        'schedule': schedule,
        'attendance_data': attendance_data,
        'check_date': check_date,
        'date_list': date_list,
        'AttendanceStatus': AttendanceStatus,
    }
    return render(request, 'training/attendance_manage.html', context)


@login_required
def update_attendance(request, attendance_id):
    if request.user.role != Role.INSTRUCTOR:
        return JsonResponse({'success': False, 'error': '无权限'}, status=403)

    attendance = get_object_or_404(Attendance, id=attendance_id)
    if attendance.enrollment.schedule.instructor != request.user:
        return JsonResponse({'success': False, 'error': '无权限'}, status=403)

    if request.method == 'POST':
        status = request.POST.get('status', '')
        remark = request.POST.get('remark', '')

        if status in dict(AttendanceStatus.choices):
            attendance.status = status
            attendance.checked_by = request.user
            if status != AttendanceStatus.NOT_CHECKED:
                attendance.check_in_time = timezone.now()
            attendance.remark = remark
            attendance.save()

            if request.headers.get('HX-Request'):
                return render(request, 'training/partials/attendance_row.html', {
                    'attendance': attendance,
                    'enrollment': attendance.enrollment,
                    'AttendanceStatus': AttendanceStatus,
                })

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})


@login_required
def exam_manage(request, schedule_id):
    if request.user.role != Role.INSTRUCTOR:
        return redirect('dashboard')

    schedule = get_object_or_404(TrainingSchedule, id=schedule_id, instructor=request.user)
    enrollments = Enrollment.objects.filter(
        schedule=schedule,
        status=EnrollmentStatus.APPROVED
    ).select_related('employee').prefetch_related('exam')

    exam_data = []
    for enrollment in enrollments:
        exam, created = Exam.objects.get_or_create(enrollment=enrollment)
        exam_data.append({
            'enrollment': enrollment,
            'exam': exam,
        })

    context = {
        'schedule': schedule,
        'exam_data': exam_data,
        'ExamStatus': ExamStatus,
        'FailureReason': FailureReason,
    }
    return render(request, 'training/exam_manage.html', context)


@login_required
def update_exam(request, exam_id):
    if request.user.role != Role.INSTRUCTOR:
        return JsonResponse({'success': False, 'error': '无权限'}, status=403)

    exam = get_object_or_404(Exam, id=exam_id)
    if exam.enrollment.schedule.instructor != request.user:
        return JsonResponse({'success': False, 'error': '无权限'}, status=403)

    if request.method == 'GET':
        return render(request, 'training/partials/exam_edit_form.html', {
            'exam': exam,
            'FailureReason': FailureReason,
        })

    if request.method == 'POST':
        score = request.POST.get('score', '')
        failure_reason = request.POST.get('failure_reason', '')
        exam_date = request.POST.get('exam_date', '')
        remark = request.POST.get('remark', '')

        if score:
            exam.score = int(score)
        if failure_reason and failure_reason in dict(FailureReason.choices):
            exam.failure_reason = failure_reason
        if exam_date:
            from datetime import datetime
            exam.exam_date = datetime.strptime(exam_date, '%Y-%m-%d').date()
        exam.remark = remark
        exam.confirmed_by = request.user
        exam.confirmed_at = timezone.now()

        if score:
            course = exam.enrollment.schedule.course
            if int(score) >= course.pass_score:
                exam.status = ExamStatus.PASSED
                exam.failure_reason = None
            else:
                exam.status = ExamStatus.FAILED
                if not exam.failure_reason:
                    exam.failure_reason = FailureReason.SCORE_TOO_LOW

        exam.save()

        if request.headers.get('HX-Request'):
            return render(request, 'training/partials/exam_row.html', {
                'exam': exam,
                'enrollment': exam.enrollment,
                'ExamStatus': ExamStatus,
                'FailureReason': FailureReason,
            })

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})


class HRRequiredMixin(LoginRequiredMixin, RoleRequiredMixin):
    allowed_roles = [Role.HR]


@login_required
def certificate_list(request):
    if request.user.role not in [Role.HR, Role.TRAINING_ADMIN, Role.INSTRUCTOR]:
        if request.user.role == Role.EMPLOYEE:
            certs = Certificate.objects.filter(
                enrollment__employee=request.user
            ).select_related('enrollment', 'enrollment__schedule', 'enrollment__schedule__course')
            return render(request, 'training/my_certificates.html', {'certificates': certs})
        return redirect('dashboard')

    status_filter = request.GET.get('status', '')
    certificates = Certificate.objects.all().select_related(
        'enrollment', 'enrollment__employee', 'enrollment__schedule', 'enrollment__schedule__course'
    ).order_by('-created_at')

    if status_filter:
        certificates = certificates.filter(status=status_filter)

    context = {
        'certificates': certificates,
        'status_filter': status_filter,
        'CertificateStatus': CertificateStatus,
    }
    return render(request, 'training/certificate_list.html', context)


@login_required
def issue_certificate(request, certificate_id):
    if request.user.role != Role.HR:
        return JsonResponse({'success': False, 'error': '无权限'}, status=403)

    certificate = get_object_or_404(Certificate, id=certificate_id)

    if request.method == 'POST':
        if not certificate.can_be_issued():
            messages.error(request, '不满足发证条件：考试未通过或缺勤过多')
            if request.headers.get('HX-Request'):
                return render(request, 'training/partials/certificate_status.html', {'certificate': certificate})
            return redirect('certificate_list')

        certificate.status = CertificateStatus.ISSUED
        certificate.issued_date = timezone.now().date()
        certificate.issued_by = request.user
        certificate.save()

        CertificateHistory.objects.create(
            certificate=certificate,
            action='发放证书',
            operator=request.user,
            remark='HR审核通过，证书已发放'
        )

        messages.success(request, '证书已发放')

        if request.headers.get('HX-Request'):
            return render(request, 'training/partials/certificate_status.html', {'certificate': certificate})

        return redirect('certificate_list')

    return JsonResponse({'success': False})


@login_required
def revoke_certificate(request, certificate_id):
    if request.user.role != Role.HR:
        return JsonResponse({'success': False, 'error': '无权限'}, status=403)

    certificate = get_object_or_404(Certificate, id=certificate_id)

    if request.method == 'POST':
        reason = request.POST.get('reason', '')
        certificate.status = CertificateStatus.REVOKED
        certificate.revoked_date = timezone.now().date()
        certificate.revoked_by = request.user
        certificate.revoke_reason = reason
        certificate.save()

        CertificateHistory.objects.create(
            certificate=certificate,
            action='撤回证书',
            operator=request.user,
            remark=reason
        )

        messages.success(request, '证书已撤回')

        if request.headers.get('HX-Request'):
            return render(request, 'training/partials/certificate_status.html', {'certificate': certificate})

        return redirect('certificate_list')

    return JsonResponse({'success': False})


@login_required
def schedule_list(request):
    if request.user.role not in [Role.TRAINING_ADMIN, Role.HR]:
        return redirect('dashboard')

    course_filter = request.GET.get('course', '')
    status_filter = request.GET.get('status', '')

    schedules = TrainingSchedule.objects.select_related('course', 'instructor').order_by('-start_date')

    if course_filter:
        schedules = schedules.filter(course_id=course_filter)
    if status_filter == 'active':
        schedules = schedules.filter(is_active=True)
    elif status_filter == 'inactive':
        schedules = schedules.filter(is_active=False)

    schedules_with_stats = []
    for s in schedules:
        schedules_with_stats.append({
            'schedule': s,
            'enrolled_count': s.enrolled_count(),
        })

    courses = Course.objects.filter(is_active=True)

    context = {
        'schedules_with_stats': schedules_with_stats,
        'courses': courses,
        'course_filter': course_filter,
        'status_filter': status_filter,
    }
    return render(request, 'training/schedule_list.html', context)


@login_required
def schedule_create(request):
    if request.user.role != Role.TRAINING_ADMIN:
        return redirect('dashboard')

    courses = Course.objects.filter(is_active=True)
    instructors = User.objects.filter(role=Role.INSTRUCTOR)

    if request.method == 'POST':
        course_id = request.POST.get('course')
        instructor_id = request.POST.get('instructor')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        location = request.POST.get('location', '')
        max_students = request.POST.get('max_students', 30)

        try:
            course = Course.objects.get(id=course_id)
            instructor = User.objects.get(id=instructor_id) if instructor_id else None

            from datetime import datetime
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()

            if start > end:
                messages.error(request, '开始日期不能晚于结束日期')
                return render(request, 'training/schedule_form.html', {
                    'courses': courses,
                    'instructors': instructors,
                    'mode': 'create',
                })

            schedule = TrainingSchedule.objects.create(
                course=course,
                instructor=instructor,
                start_date=start,
                end_date=end,
                location=location,
                max_students=int(max_students),
                is_active=True,
            )

            messages.success(request, f'排班创建成功：{schedule}')
            return redirect('schedule_list')

        except Exception as e:
            messages.error(request, f'创建失败：{str(e)}')

    context = {
        'courses': courses,
        'instructors': instructors,
        'mode': 'create',
    }
    return render(request, 'training/schedule_form.html', context)


@login_required
def schedule_edit(request, schedule_id):
    if request.user.role != Role.TRAINING_ADMIN:
        return redirect('dashboard')

    schedule = get_object_or_404(TrainingSchedule, id=schedule_id)
    courses = Course.objects.filter(is_active=True)
    instructors = User.objects.filter(role=Role.INSTRUCTOR)

    if request.method == 'POST':
        course_id = request.POST.get('course')
        instructor_id = request.POST.get('instructor')
        start_date = request.POST.get('start_date')
        end_date = request.POST.get('end_date')
        location = request.POST.get('location', '')
        max_students = request.POST.get('max_students', 30)
        is_active = request.POST.get('is_active') == 'on'

        try:
            from datetime import datetime
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()

            if start > end:
                messages.error(request, '开始日期不能晚于结束日期')
                return render(request, 'training/schedule_form.html', {
                    'schedule': schedule,
                    'courses': courses,
                    'instructors': instructors,
                    'mode': 'edit',
                })

            schedule.course_id = course_id
            schedule.instructor_id = instructor_id if instructor_id else None
            schedule.start_date = start
            schedule.end_date = end
            schedule.location = location
            schedule.max_students = int(max_students)
            schedule.is_active = is_active
            schedule.save()

            messages.success(request, '排班更新成功')
            return redirect('schedule_list')

        except Exception as e:
            messages.error(request, f'更新失败：{str(e)}')

    context = {
        'schedule': schedule,
        'courses': courses,
        'instructors': instructors,
        'mode': 'edit',
    }
    return render(request, 'training/schedule_form.html', context)


@login_required
def schedule_toggle(request, schedule_id):
    if request.user.role != Role.TRAINING_ADMIN:
        return JsonResponse({'success': False, 'error': '无权限'}, status=403)

    schedule = get_object_or_404(TrainingSchedule, id=schedule_id)

    if request.method == 'POST':
        schedule.is_active = not schedule.is_active
        schedule.save()
        messages.success(request, f'排班已{"启用" if schedule.is_active else "停用"}')

        if request.headers.get('HX-Request'):
            return render(request, 'training/partials/schedule_row.html', {
                'item': {'schedule': schedule, 'enrolled_count': schedule.enrolled_count()},
            })

        return redirect('schedule_list')

    return JsonResponse({'success': False})


@login_required
def analytics_view(request):
    if request.user.role not in [Role.HR, Role.TRAINING_ADMIN]:
        return redirect('dashboard')

    by_dept = TrainingAnalytics.by_department()
    by_course = TrainingAnalytics.by_course()
    by_reason = TrainingAnalytics.by_failure_reason()
    cycle = TrainingAnalytics.certification_cycle()

    total_failed = sum(r['count'] for r in by_reason)
    for r in by_reason:
        r['percentage'] = round((r['count'] / total_failed * 100) if total_failed > 0 else 0, 1)

    context = {
        'by_dept': by_dept,
        'by_course': by_course,
        'by_reason': by_reason,
        'cycle': cycle,
    }
    return render(request, 'training/analytics.html', context)


def generate_certificate_no():
    import datetime
    date_str = datetime.datetime.now().strftime('%Y%m%d')
    suffix = uuid.uuid4().hex[:6].upper()
    return f'CERT-{date_str}-{suffix}'
