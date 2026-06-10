from django import forms
from .models import Application, Consumable

class LoginForm(forms.Form):
    username = forms.CharField(label='用户名', max_length=100)
    password = forms.CharField(label='密码', widget=forms.PasswordInput)

class ApplicationForm(forms.ModelForm):
    class Meta:
        model = Application
        fields = ['consumable', 'requested_quantity', 'purpose']
        labels = {
            'consumable': '耗材',
            'requested_quantity': '领用数量',
            'purpose': '用途说明',
        }
        widgets = {
            'purpose': forms.Textarea(attrs={'rows': 3}),
        }

class ReturnForm(forms.Form):
    returned_quantity = forms.IntegerField(label='归还数量', min_value=1)
    condition = forms.CharField(label='状态', max_length=200, required=False)
    notes = forms.CharField(label='备注', widget=forms.Textarea(attrs={'rows': 3}), required=False)
