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
        
        return JsonResponse({'success': True, 'penalty_id': penalty.id})
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
    
    return JsonResponse({'success': True, 'message': '轨迹重算完成'})

@login_required
def kanban(request):
    sites = Site.objects.annotate(appeal_count=Count('appeal__penalty')).all()
    rules = PenaltyRule.objects.annotate(appeal_count=Count('penalty__appeal')).all()
    status_counts = Appeal.objects.values('status').annotate(count=Count('id'))
    result_counts = Appeal.objects.values('result').annotate(count=Count('id'))
    
    duration = ExpressionWrapper(timezone.now() - F('created_at'), output_field=DurationField())
    avg_duration = Appeal.objects.aggregate(avg_duration=duration.avg)
    
    context = {
        'sites': sites,
        'rules': rules,
        'status_counts': status_counts,
        'result_counts': result_counts,
        'avg_duration': avg_duration['avg_duration'],
        'total_appeals': Appeal.objects.count(),
        'pending_count': Appeal.objects.filter(status__in=['pending', 'first_review', 'arbitration']).count(),
        'completed_count': Appeal.objects.filter(status__in=['approved', 'rejected']).count()
    }
    return render(request, 'kanban.html', context)

@login_required
def penalty_list(request):
    penalties = Penalty.objects.select_related('order', 'rule', 'rider', 'site').all().order_by('-created_at')
    return render(request, 'penalty_list.html', {'penalties': penalties})