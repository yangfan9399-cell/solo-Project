from django import forms
from django.utils import timezone
from .models import WorkOrder, LightPole, Evidence, User


class WorkOrderCreateForm(forms.ModelForm):
    class Meta:
        model = WorkOrder
        fields = ['light_pole', 'title', 'fault_source', 'fault_type', 'description']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 4, 'class': 'w-full px-3 py-2 border rounded-lg'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            if not isinstance(field.widget, forms.Textarea):
                field.widget.attrs.update({'class': 'w-full px-3 py-2 border rounded-lg'})


class WorkOrderInspectForm(forms.ModelForm):
    class Meta:
        model = WorkOrder
        fields = ['repair_description', 'is_location_error', 'location_error_note', 'actual_energy']
        widgets = {
            'repair_description': forms.Textarea(attrs={'rows': 4, 'class': 'w-full px-3 py-2 border rounded-lg'}),
            'location_error_note': forms.Textarea(attrs={'rows': 3, 'class': 'w-full px-3 py-2 border rounded-lg'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            if not isinstance(field.widget, forms.Textarea):
                if not isinstance(field.widget, forms.CheckboxInput):
                    field.widget.attrs.update({'class': 'w-full px-3 py-2 border rounded-lg'})


class WorkOrderReviewForm(forms.ModelForm):
    class Meta:
        model = WorkOrder
        fields = ['anomaly_cause', 'review_comment', 'expected_energy']
        widgets = {
            'anomaly_cause': forms.Textarea(attrs={'rows': 4, 'class': 'w-full px-3 py-2 border rounded-lg'}),
            'review_comment': forms.Textarea(attrs={'rows': 3, 'class': 'w-full px-3 py-2 border rounded-lg'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            if not isinstance(field.widget, forms.Textarea):
                field.widget.attrs.update({'class': 'w-full px-3 py-2 border rounded-lg'})


class EvidenceUploadForm(forms.ModelForm):
    class Meta:
        model = Evidence
        fields = ['evidence_type', 'file', 'description']
        widgets = {
            'description': forms.TextInput(attrs={'class': 'w-full px-3 py-2 border rounded-lg'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            if not isinstance(field.widget, forms.FileInput):
                field.widget.attrs.update({'class': 'w-full px-3 py-2 border rounded-lg'})


class AssignInspectorForm(forms.Form):
    inspector = forms.ModelChoiceField(
        queryset=User.objects.filter(role='inspector', is_active=True),
        label='指派巡检员',
        widget=forms.Select(attrs={'class': 'w-full px-3 py-2 border rounded-lg'})
    )


class AssignReviewerForm(forms.Form):
    reviewer = forms.ModelChoiceField(
        queryset=User.objects.filter(role='reviewer', is_active=True),
        label='指派复核人',
        widget=forms.Select(attrs={'class': 'w-full px-3 py-2 border rounded-lg'})
    )


class ReturnOrderForm(forms.Form):
    reason = forms.CharField(
        label='退回原因',
        widget=forms.Textarea(attrs={'rows': 4, 'class': 'w-full px-3 py-2 border rounded-lg'})
    )


class WorkOrderFilterForm(forms.Form):
    STATUS_CHOICES = [('', '全部状态')] + list(WorkOrder.STATUS_CHOICES)
    FAULT_TYPE_CHOICES = [('', '全部类型')] + list(WorkOrder.FAULT_TYPE_CHOICES)
    AREA_CHOICES = [('', '全部片区')]

    status = forms.ChoiceField(choices=STATUS_CHOICES, required=False, widget=forms.Select(attrs={'class': 'w-full px-3 py-2 border rounded-lg'}))
    fault_type = forms.ChoiceField(choices=FAULT_TYPE_CHOICES, required=False, widget=forms.Select(attrs={'class': 'w-full px-3 py-2 border rounded-lg'}))
    area = forms.ChoiceField(choices=AREA_CHOICES, required=False, widget=forms.Select(attrs={'class': 'w-full px-3 py-2 border rounded-lg'}))
    keyword = forms.CharField(required=False, widget=forms.TextInput(attrs={'class': 'w-full px-3 py-2 border rounded-lg', 'placeholder': '搜索工单编号、标题...'}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        areas = LightPole.objects.values_list('area', flat=True).distinct()
        self.fields['area'].choices = [('', '全部片区')] + [(a, a) for a in areas]


class DateRangeForm(forms.Form):
    start_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'w-full px-3 py-2 border rounded-lg'})
    )
    end_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date', 'class': 'w-full px-3 py-2 border rounded-lg'})
    )
