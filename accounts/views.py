from django.contrib.auth import login, logout
from django.contrib.auth.views import LoginView
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib import messages
from .forms import LoginForm, UserProfileForm


class CustomLoginView(LoginView):
    form_class = LoginForm
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True

    def form_valid(self, form):
        user = form.get_user()
        login(self.request, user)
        messages.success(self.request, f'欢迎回来，{user.get_full_name()}！')
        return HttpResponseRedirect(self.get_success_url())

    def get_success_url(self):
        user = self.request.user
        if user.is_reviewer or user.is_admin or user.is_superuser:
            return reverse('access_control:dashboard')
        elif user.is_field_staff:
            return reverse('access_control:processing_desk')
        return reverse('access_control:dashboard')

    def form_invalid(self, form):
        messages.error(self.request, '登录失败，请检查用户名和密码')
        return super().form_invalid(form)


def custom_logout_view(request):
    logout(request)
    messages.info(request, '您已安全退出系统')
    return redirect('accounts:login')


@login_required
def profile_view(request):
    if request.method == 'POST':
        form = UserProfileForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, '个人信息已更新')
            return redirect('accounts:profile')
    else:
        form = UserProfileForm(instance=request.user)
    return render(request, 'accounts/profile.html', {'form': form})
