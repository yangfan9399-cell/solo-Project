import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'billboard_system.settings')
import django
django.setup()

from django.test import RequestFactory
from django.contrib.messages.middleware import MessageMiddleware
from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.auth import get_user_model
from construction.models import ConstructionPlan
from construction.views import pm_review, safety_review, acceptance, delay_apply

User = get_user_model()

def test_status_intercept():
    print('=== 验证状态流转拦截 ===\n')

    pm = User.objects.get(username='pm1')
    safety = User.objects.get(username='safety1')
    acceptor = User.objects.get(username='acceptor1')
    constructor = User.objects.get(username='constructor1')

    plan_accepted = ConstructionPlan.objects.get(status='accepted')
    plan_in_progress = ConstructionPlan.objects.get(status='in_progress')

    factory = RequestFactory()

    def add_middleware(request):
        SessionMiddleware().process_request(request)
        MessageMiddleware().process_request(request)
        request.session.save()

    print(f'测试1: pm_review 在已验收状态({plan_accepted.status})应被拦截')
    request = factory.get(f'/plans/{plan_accepted.pk}/pm-review/')
    request.user = pm
    add_middleware(request)
    response = pm_review(request, plan_accepted.pk)
    print(f'  状态码: {response.status_code} (302=重定向即拦截成功)')
    print(f'  重定向URL包含 plan_detail: {"plan_detail" in response.url}')
    print()

    print(f'测试2: safety_review 在施工中状态({plan_in_progress.status})应被拦截')
    request = factory.get(f'/plans/{plan_in_progress.pk}/safety-review/')
    request.user = safety
    add_middleware(request)
    response = safety_review(request, plan_in_progress.pk)
    print(f'  状态码: {response.status_code} (302=重定向即拦截成功)')
    print(f'  重定向URL包含 plan_detail: {"plan_detail" in response.url}')
    print()

    print(f'测试3: acceptance 在施工中状态({plan_in_progress.status})应被拦截')
    request = factory.get(f'/plans/{plan_in_progress.pk}/acceptance/')
    request.user = acceptor
    add_middleware(request)
    response = acceptance(request, plan_in_progress.pk)
    print(f'  状态码: {response.status_code} (302=重定向即拦截成功)')
    print(f'  重定向URL包含 plan_detail: {"plan_detail" in response.url}')
    print()

    print(f'测试4: delay_apply 在已验收状态({plan_accepted.status})应被拦截')
    request = factory.get(f'/plans/{plan_accepted.pk}/delay-apply/')
    request.user = constructor
    add_middleware(request)
    response = delay_apply(request, plan_accepted.pk)
    print(f'  状态码: {response.status_code} (302=重定向即拦截成功)')
    print(f'  重定向URL包含 plan_detail: {"plan_detail" in response.url}')
    print()

    print('=== 所有测试完成 ===')

if __name__ == '__main__':
    test_status_intercept()
