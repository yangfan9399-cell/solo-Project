from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.contrib import messages


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f'欢迎，{user.full_name}！')
            return redirect('/')
        else:
            messages.error(request, '用户名或密码错误')
    return render(request, 'accounts/login.html')


@require_POST
def logout_view(request):
    logout(request)
    messages.info(request, '您已成功登出')
    return redirect('/accounts/login/')


@login_required
def profile_view(request):
    return render(request, 'accounts/profile.html', {'user': request.user})