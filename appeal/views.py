from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponse, JsonResponse
from django.db.models import Count, F, DurationField, ExpressionWrapper
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from .models import *

def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard')
        else:
            return render(request, 'login.html', {'error': '用户名或密码错误'})
    return render(request, 'login.html')

@login_required
def dashboard(request):
    appeals = Appeal.objects.select_related('penalty__order', 'penalty__rule', 'rider__site').all().order_by('-created_at')
    return render(request, 'dashboard.html', {'appeals': appeals})

@login_required
def appeal_detail(request, appeal_id):
    appeal = get_object_or_404(Appeal, id=appeal_id)
    penalty = appeal.penalty
    order = penalty.order
    rider = appeal.rider
    history = appeal.history.all().order_by('created_at')
    trajectories = Trajectory.objects.filter(rider=rider, order=order).order_by('timestamp')
    chat_evidences = appeal.chat_evidences.all().order_by('timestamp')
    evidences = appeal.evidences.all()
    
    context = {
        'appeal': appeal,
        'penalty': penalty,
        'order': order,
        'rider': rider,
        'history': history,
        'trajectories': trajectories,
        'chat_evidences': chat_evidences,
        'evidences': evidences,
        'is_location_drift': penalty.rule.rule_type == 'location_drift'
    }
    return render(request, 'appeal_detail.html', context)

@login_required
def create_penalty(request):
    if request.method == 'POST':
        order_no = request.POST['order_no']
        rule_id = request.POST['rule_id']
        rider_id = request.POST['rider_id']
        site_id = request.POST['site_id']
        amount = request.POST['amount']
        description = request.POST['description']
        
        order = Order.objects.get(order_no=order_no)
        rule = PenaltyRule.objects.get(id=rule_id)
        rider = Rider.objects.get(id=rider_id)
        site = Site.objects.get(id=site_id)
        
        penalty = Penalty.objects.create(
            order=order,
            rule=rule,
            rider=rider,
            site=site,
            amount=amount,
            description=description,
            created_by=request.user,
            status='pending'
        )
        
        return redirect('penalty_list')
    else:
        orders = Order.objects.all()
        rules = PenaltyRule.objects.filter(is_active=True)
        riders = Rider.objects.filter(status='active')
        sites = Site.objects.all()
        return render(request, 'create_penalty.html', {'orders': orders, 'rules': rules, 'riders': riders, 'sites': sites})

@login_required
def submit_appeal(request, penalty_id):
    penalty = get_object_or_404(Penalty, id=penalty_id)
    if request.method == 'POST':
        reason = request.POST['reason']
        evidence_description = request.POST.get('evidence_description', '')
        
        appeal = Appeal.objects.create(
            penalty=penalty,
            rider=penalty.rider,
            reason=reason,
            status='pending'
        )
        
        AppealHistory.objects.create(
            appeal=appeal,
            action='appeal',
            operator=request.user,
            comment=reason
        )
        
        if request.FILES.getlist('evidence_files'):
            for file in request.FILES.getlist('evidence_files'):
                file_ext = file.name.split('.')[-1].lower()
                if file_ext in ['jpg', 'jpeg', 'png', 'gif']:
                    evidence_type = 'image'
                elif file_ext in ['mp4', 'mov', 'avi', 'mkv']:
                    evidence_type = 'video'
                else:
                    evidence_type = 'other'
                
                Evidence.objects.create(
                    appeal=appeal,
                    file=file,
                    evidence_type=evidence_type,
                    description=evidence_description
                )
        
        penalty.status = 'appealing'
        penalty.save()
        
        return redirect('appeal_detail', appeal_id=appeal.id)
    return render(request, 'submit_appeal.html', {'penalty': penalty})

@login_required
def first_review(request, appeal_id):
    appeal = get_object_or_404(Appeal, id=appeal_id)
    if request.method == 'POST':
        action = request.POST['action']
        comment = request.POST.get('comment', '')
        
        if action == 'pass':
            appeal.status = 'first_approved'
            AppealHistory.objects.create(
                appeal=appeal,
                action='first_review_pass',
                operator=request.user,
                comment=comment
            )
        elif action == 'reject':
            appeal.status = 'first_rejected'
            appeal.result = 'maintained'
            AppealHistory.objects.create(
                appeal=appeal,
                action='first_review_reject',
                operator=request.user,
                comment=comment
            )
        elif action == 'supplement':
            appeal.status = 'supplement'
            appeal.result = 'supplement'
            AppealHistory.objects.create(
                appeal=appeal,
                action='supplement',
                operator=request.user,
                comment=comment
            )
        
        appeal.save()
        return redirect('appeal_detail', appeal_id=appeal.id)
    return render(request, 'first_review.html', {'appeal': appeal})

@login_required
def arbitration_review(request, appeal_id):
    appeal = get_object_or_404(Appeal, id=appeal_id)
    if request.method == 'POST':
        action = request.POST['action']
        comment = request.POST.get('comment', '')
        
        if action == 'revoke':
            appeal.status = 'approved'
            appeal.result = 'revoked'
            appeal.penalty.status = 'resolved'
            appeal.penalty.save()
            AppealHistory.objects.create(
                appeal=appeal,
                action='arbitration_pass',
                operator=request.user,
                comment=comment
            )
        elif action == 'maintain':
            appeal.status = 'rejected'
            appeal.result = 'maintained'
            appeal.penalty.status = 'resolved'
            appeal.penalty.save()
            AppealHistory.objects.create(
                appeal=appeal,
                action='arbitration_reject',
                operator=request.user,
                comment=comment
            )
        elif action == 'supplement':
            appeal.status = 'supplement'
            appeal.result = 'supplement'
            AppealHistory.objects.create(
                appeal=appeal,
                action='supplement',
                operator=request.user,
                comment=comment
            )
        
        appeal.save()
        return redirect('appeal_detail', appeal_id=appeal.id)
    return render(request, 'arbitration_review.html', {'appeal': appeal})

@login_required
def resubmit_evidence(request, appeal_id):
    appeal = get_object_or_404(Appeal, id=appeal_id)
    if request.method == 'POST':
        reason = request.POST.get('reason', '')
        
        appeal.status = 'pending'
        appeal.save()
        
        AppealHistory.objects.create(
            appeal=appeal,
            action='resubmit',
            operator=request.user,
            comment=reason
        )
        
        return redirect('appeal_detail', appeal_id=appeal.id)
    return render(request, 'resubmit_evidence.html', {'appeal': appeal})

@login_required
def recalculate_trajectory(request, appeal_id):
    appeal = get_object_or_404(Appeal, id=appeal_id)
    penalty = appeal.penalty
    
    if penalty.rule.rule_type != 'location_drift':
        return JsonResponse({'success': False, 'message': '只有定位漂移类型的扣罚才能重算轨迹'})
    
    trajectories = Trajectory.objects.filter(rider=appeal.rider, order=penalty.order)
    
    for traj in trajectories:
        if traj.accuracy > 100:
            traj.is_recalculated = True
            traj.accuracy = min(traj.accuracy * 0.3, 50)
            traj.recalculated_at = timezone.now()
            traj.save()
    
    AppealHistory.objects.create(
        appeal=appeal,
        action='trajectory_recalc',
        operator=request.user,
        comment='系统已重新计算定位轨迹'
    )
    
    trajectories = Trajectory.objects.filter(rider=appeal.rider, order=penalty.order).order_by('timestamp')
    history = appeal.history.all().order_by('created_at')
    
    return render(request, 'trajectory_table.html', {
        'trajectories': trajectories,
        'history': history,
        'appeal_id': appeal.id
    })

@login_required
def kanban(request):
    sites = Site.objects.all()
    site_stats = []
    for site in sites:
        appeal_count = Appeal.objects.filter(rider__site=site).count()
        site_stats.append({'site': site, 'appeal_count': appeal_count})
    
    rules = PenaltyRule.objects.all()
    rule_stats = []
    for rule in rules:
        appeal_count = Appeal.objects.filter(penalty__rule=rule).count()
        rule_stats.append({'rule': rule, 'appeal_count': appeal_count})
    
    status_counts = Appeal.objects.values('status').annotate(count=Count('id'))
    result_counts = Appeal.objects.values('result').annotate(count=Count('id'))
    
    completed_appeals = Appeal.objects.filter(status__in=['approved', 'rejected'])
    avg_duration_days = 0
    avg_duration_hours = 0
    if completed_appeals.exists():
        total_seconds = 0
        for appeal in completed_appeals:
            if appeal.updated_at:
                diff = appeal.updated_at - appeal.created_at
                total_seconds += diff.total_seconds()
            else:
                diff = timezone.now() - appeal.created_at
                total_seconds += diff.total_seconds()
        avg_seconds = total_seconds / completed_appeals.count()
        avg_duration_days = int(avg_seconds // (24 * 3600))
        avg_duration_hours = int((avg_seconds % (24 * 3600)) // 3600)
    
    context = {
        'site_stats': site_stats,
        'rule_stats': rule_stats,
        'status_counts': status_counts,
        'result_counts': result_counts,
        'avg_duration_days': avg_duration_days,
        'avg_duration_hours': avg_duration_hours,
        'total_appeals': Appeal.objects.count(),
        'pending_count': Appeal.objects.filter(status__in=['pending', 'first_review', 'arbitration']).count(),
        'completed_count': completed_appeals.count()
    }
    return render(request, 'kanban.html', context)

@login_required
def penalty_list(request):
    penalties = Penalty.objects.select_related('order', 'rule', 'rider', 'site').all().order_by('-created_at')
    return render(request, 'penalty_list.html', {'penalties': penalties})