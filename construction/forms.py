from django import forms
from django.contrib.auth.forms import AuthenticationForm
from .models import ConstructionPlan, Worker, DelayRecord, AuditNode, BillboardLocation


class LoginForm(AuthenticationForm):
    username = forms.CharField(
        label='用户名',
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '请输入用户名'})
    )
    password = forms.CharField(
        label='密码',
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': '请输入密码'})
    )


class ConstructionPlanForm(forms.ModelForm):
    class Meta:
        model = ConstructionPlan
        fields = [
            'title', 'location', 'planned_start_date', 'planned_end_date',
            'construction_content', 'materials', 'safety_measures', 'budget'
        ]
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'location': forms.Select(attrs={'class': 'form-select'}),
            'planned_start_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'planned_end_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'construction_content': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'materials': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'safety_measures': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'budget': forms.NumberInput(attrs={'class': 'form-control'}),
        }
        labels = {
            'title': '施工计划标题',
            'location': '施工点位',
            'planned_start_date': '计划开工日期',
            'planned_end_date': '计划完工日期',
            'construction_content': '施工内容',
            'materials': '主要材料清单',
            'safety_measures': '安全措施',
            'budget': '预算金额(元)',
        }


class PlanWorkerForm(forms.Form):
    workers = forms.ModelMultipleChoiceField(
        queryset=Worker.objects.filter(is_active=True),
        widget=forms.CheckboxSelectMultiple,
        label='选择施工人员',
        required=False
    )


class DelayApplyForm(forms.ModelForm):
    class Meta:
        model = DelayRecord
        fields = ['delay_type', 'delay_days', 'reason']
        widgets = {
            'delay_type': forms.Select(attrs={'class': 'form-select'}),
            'delay_days': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
            'reason': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }
        labels = {
            'delay_type': '延期原因',
            'delay_days': '延期天数',
            'reason': '延期说明',
        }


class AuditForm(forms.Form):
    comment = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': '请输入审核意见...'}),
        required=False,
        label='审核意见'
    )


class LocationForm(forms.ModelForm):
    class Meta:
        model = BillboardLocation
        fields = [
            'code', 'name', 'city', 'address', 'location_type',
            'height', 'width', 'height_dim', 'description', 'is_active'
        ]
        widgets = {
            'code': forms.TextInput(attrs={'class': 'form-control'}),
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'city': forms.TextInput(attrs={'class': 'form-control'}),
            'address': forms.TextInput(attrs={'class': 'form-control'}),
            'location_type': forms.Select(attrs={'class': 'form-select'}),
            'height': forms.NumberInput(attrs={'class': 'form-control'}),
            'width': forms.NumberInput(attrs={'class': 'form-control'}),
            'height_dim': forms.NumberInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'is_active': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
