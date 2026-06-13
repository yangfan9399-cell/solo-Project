from django import forms
from .models import EvidenceAttachment, BusinessRecord, ApprovalNode


class EvidenceUploadForm(forms.ModelForm):
    class Meta:
        model = EvidenceAttachment
        fields = ['file_type', 'file', 'file_name', 'description']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }


class BusinessRecordForm(forms.ModelForm):
    class Meta:
        model = BusinessRecord
        fields = ['record_type', 'title', 'content']
        widgets = {
            'content': forms.Textarea(attrs={'rows': 4}),
        }


class ProcessActionForm(forms.Form):
    ACTION_CHOICES = [
        ('submit_review', '提交复核'),
        ('return', '退回补证'),
    ]
    action = forms.ChoiceField(choices=ACTION_CHOICES, widget=forms.RadioSelect)
    remarks = forms.CharField(label='处理意见', widget=forms.Textarea(attrs={'rows': 4}), required=False)
    basis = forms.CharField(label='采用依据', widget=forms.Textarea(attrs={'rows': 3}), required=False)


class ReviewActionForm(forms.Form):
    ACTION_CHOICES = [
        ('approve', '正常放行'),
        ('reject', '异常阻断'),
        ('return', '退回补证'),
        ('archive', '归档'),
    ]
    action = forms.ChoiceField(choices=ACTION_CHOICES, widget=forms.RadioSelect)
    remarks = forms.CharField(label='复核意见', widget=forms.Textarea(attrs={'rows': 4}), required=True)
    basis = forms.CharField(label='采用依据', widget=forms.Textarea(attrs={'rows': 3}), required=False)
    conclusion = forms.CharField(label='最终结论', widget=forms.Textarea(attrs={'rows': 3}), required=False)
    actual_loss = forms.DecimalField(label='实际损失金额', required=False, max_digits=12, decimal_places=2)
    responsible_party = forms.CharField(label='责任对象', required=False, max_length=200)
