from django import forms
from .models import AccessRecoveryRecord, EvidenceAttachment
from .services import WorkflowService
from datetime import date


class RecordProcessForm(forms.Form):
    business_note = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
        label='业务记录',
        required=False,
        help_text='请详细描述业务背景和授权情况'
    )
    site_description = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
        label='现场说明',
        required=False,
        help_text='请描述现场核实情况'
    )
    recovered_date = forms.DateField(
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date', 'max': date.today().strftime('%Y-%m-%d')}),
        label='实际回收日期',
        required=False,
        help_text='权限实际回收的日期'
    )
    conclusion = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
        label='处理结论',
        required=False,
        help_text='请给出明确的处理结论'
    )
    recovery_basis = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        label='采用依据',
        required=False,
        help_text='引用的规章制度或政策依据'
    )
    remedial_path = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        label='补救路径',
        required=False,
        help_text='如存在异常，请描述补救措施'
    )

    def __init__(self, *args, record=None, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.record = record
        self.user = user

        if record and record.is_archived:
            for field in self.fields.values():
                field.widget.attrs['disabled'] = True
                field.required = False

        if user and user.is_reviewer:
            pass
        elif user and user.is_field_staff:
            if 'conclusion' in self.fields:
                self.fields['conclusion'].help_text += '（现场人员填写后需提交复核）'

    def clean(self):
        cleaned_data = super().clean()
        if self.record and self.record.is_archived:
            raise forms.ValidationError('已归档记录不能编辑')
        return cleaned_data


class EvidenceUploadForm(forms.ModelForm):
    class Meta:
        model = EvidenceAttachment
        fields = ('evidence_type', 'title', 'description', 'file')
        widgets = {
            'evidence_type': forms.Select(attrs={'class': 'form-select'}),
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'file': forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*,video/*,.pdf,.doc,.docx'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['file'].required = True

    def clean_file(self):
        file = self.cleaned_data.get('file')
        if file:
            max_size = 50 * 1024 * 1024
            if file.size > max_size:
                raise forms.ValidationError('文件大小不能超过50MB')
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4',
                           'application/pdf', 'application/msword',
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            if hasattr(file, 'content_type') and file.content_type not in allowed_types:
                raise forms.ValidationError('不支持的文件格式')
        return file


class RecordFilterForm(forms.Form):
    STATUS_CHOICES = [('', '全部状态')] + list(AccessRecoveryRecord.Status.choices)
    SAMPLE_TYPE_CHOICES = [('', '全部类型')] + list(AccessRecoveryRecord.SampleType.choices)
    SOURCE_CHOICES = [('', '全部来源')] + list(AccessRecoveryRecord.SourceType.choices)
    RISK_CHOICES = [('', '全部风险'), ('low', '低风险'), ('medium', '中风险'), ('high', '高风险'), ('critical', '极高风险')]

    status = forms.ChoiceField(choices=STATUS_CHOICES, required=False, widget=forms.Select(attrs={'class': 'form-select', 'onchange': 'this.form.submit()'}))
    sample_type = forms.ChoiceField(choices=SAMPLE_TYPE_CHOICES, required=False, widget=forms.Select(attrs={'class': 'form-select', 'onchange': 'this.form.submit()'}))
    source = forms.ChoiceField(choices=SOURCE_CHOICES, required=False, widget=forms.Select(attrs={'class': 'form-select', 'onchange': 'this.form.submit()'}))
    risk_level = forms.ChoiceField(choices=RISK_CHOICES, required=False, widget=forms.Select(attrs={'class': 'form-select', 'onchange': 'this.form.submit()'}))
    keyword = forms.CharField(required=False, widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '搜索记录编号、标题、申请人...'}))
    start_date = forms.DateField(required=False, widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}))
    end_date = forms.DateField(required=False, widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}))
    only_overdue = forms.BooleanField(required=False, widget=forms.CheckboxInput(attrs={'class': 'form-check-input', 'onchange': 'this.form.submit()'}))
    only_blocked = forms.BooleanField(required=False, widget=forms.CheckboxInput(attrs={'class': 'form-check-input', 'onchange': 'this.form.submit()'}))


class ReviewRejectForm(forms.Form):
    reject_reason = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
        label='退回原因',
        required=True,
        help_text='请详细说明退回补证的原因'
    )
    remedial_path = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        label='补救路径',
        required=False,
        help_text='请说明需要补充的材料或改进措施'
    )


class ReopenForm(forms.Form):
    reason = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
        label='重新处理原因',
        required=True,
        help_text='请详细说明需要重新处理的原因'
    )


class DashboardFilterForm(forms.Form):
    PERIOD_CHOICES = [
        ('', '全部时间'),
        ('today', '今日'),
        ('week', '本周'),
        ('month', '本月'),
        ('quarter', '本季度'),
        ('year', '本年度'),
    ]
    SAMPLE_TYPE_CHOICES = [('', '全部类型')] + list(AccessRecoveryRecord.SampleType.choices)
    STATUS_CHOICES = [('', '全部状态')] + list(AccessRecoveryRecord.Status.choices)

    period = forms.ChoiceField(choices=PERIOD_CHOICES, required=False, widget=forms.Select(attrs={'class': 'form-select'}))
    sample_type = forms.ChoiceField(choices=SAMPLE_TYPE_CHOICES, required=False, widget=forms.Select(attrs={'class': 'form-select'}))
    status = forms.ChoiceField(choices=STATUS_CHOICES, required=False, widget=forms.Select(attrs={'class': 'form-select'}))
    start_date = forms.DateField(required=False, widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}))
    end_date = forms.DateField(required=False, widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}))
