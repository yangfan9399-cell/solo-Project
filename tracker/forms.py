from django import forms

from tracker.models import (
    CleaningRecord,
    ClinicalUsage,
    ExpiryRecall,
    InfectionInspection,
    InstrumentPackage,
    ReleaseAudit,
    SterilizationBatch,
)


class InstrumentPackageForm(forms.ModelForm):
    class Meta:
        model = InstrumentPackage
        fields = ['code', 'name', 'category', 'contents', 'clinic', 'sterilization_expiry_days']
        widgets = {
            'contents': forms.Textarea(attrs={'rows': 4, 'placeholder': '每行一项器械名称'}),
            'code': forms.TextInput(attrs={'placeholder': '例：QP-2024-001'}),
        }


class CleaningRecordForm(forms.ModelForm):
    class Meta:
        model = CleaningRecord
        fields = ['instrument_package', 'method', 'cleaning_agent', 'cleaner', 'started_at', 'completed_at', 'result', 'notes']
        widgets = {
            'started_at': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'completed_at': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['instrument_package'].queryset = InstrumentPackage.objects.filter(
            status__in=['in_use', 'registered']
        )


class SterilizationBatchForm(forms.ModelForm):
    class Meta:
        model = SterilizationBatch
        fields = [
            'batch_number', 'method', 'operator', 'started_at', 'completed_at',
            'temperature', 'pressure', 'duration_minutes',
            'physical_test', 'chemical_test', 'biological_test', 'result', 'notes',
            'instrument_packages',
        ]
        widgets = {
            'started_at': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'completed_at': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
            'instrument_packages': forms.CheckboxSelectMultiple(),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['instrument_packages'].queryset = InstrumentPackage.objects.filter(
            status='cleaning'
        )


class ReleaseAuditForm(forms.ModelForm):
    class Meta:
        model = ReleaseAudit
        fields = [
            'instrument_package', 'batch', 'auditor',
            'packaging_intact', 'indicator_changed', 'label_clear', 'seal_intact',
            'audit_result', 'notes',
        ]
        widgets = {
            'notes': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, batch=None, **kwargs):
        super().__init__(*args, **kwargs)
        if batch:
            self.fields['batch'].queryset = SterilizationBatch.objects.filter(pk=batch.pk)
            self.fields['batch'].initial = batch.pk
            self.fields['instrument_package'].queryset = batch.instrument_packages.filter(
                status='pending_release'
            )
        else:
            self.fields['instrument_package'].queryset = InstrumentPackage.objects.filter(
                status='pending_release'
            )
            self.fields['batch'].queryset = SterilizationBatch.objects.filter(
                result='qualified'
            )

    def clean(self):
        cleaned_data = super().clean()
        instrument = cleaned_data.get('instrument_package')
        batch = cleaned_data.get('batch')
        if instrument and batch:
            if not batch.instrument_packages.filter(pk=instrument.pk).exists():
                raise forms.ValidationError(
                    f'器械包 {instrument.code} 不属于批次 {batch.batch_number}，无法审核'
                )
            if instrument.status != 'pending_release':
                raise forms.ValidationError(
                    f'器械包 {instrument.code} 当前状态为「{instrument.get_status_display()}」，不是待放行状态，无法审核'
                )
            if batch.result != 'qualified':
                raise forms.ValidationError(
                    f'批次 {batch.batch_number} 综合结果为「{batch.get_result_display()}」，只有合格批次才能审核放行'
                )
        return cleaned_data


class ClinicalUsageForm(forms.ModelForm):
    class Meta:
        model = ClinicalUsage
        fields = [
            'instrument_package', 'patient_id', 'patient_name',
            'doctor', 'clinic', 'procedure', 'used_at', 'notes',
        ]
        widgets = {
            'used_at': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['instrument_package'].queryset = InstrumentPackage.objects.filter(
            status='registered'
        )


class ExpiryRecallForm(forms.ModelForm):
    class Meta:
        model = ExpiryRecall
        fields = ['instrument_package', 'reason', 'initiator', 'notes']
        widgets = {
            'notes': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['instrument_package'].queryset = InstrumentPackage.objects.filter(
            status__in=['registered', 'expired']
        )


class InfectionInspectionForm(forms.ModelForm):
    class Meta:
        model = InfectionInspection
        fields = [
            'inspection_type', 'instrument_package', 'batch',
            'inspector', 'result', 'findings', 'corrective_action', 'notes',
        ]
        widgets = {
            'findings': forms.Textarea(attrs={'rows': 3}),
            'corrective_action': forms.Textarea(attrs={'rows': 3}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }


class InstrumentStatusForm(forms.Form):
    STATUS_TRANSITIONS = {
        'registered': [('in_use', '领取使用')],
        'in_use': [('cleaning', '送洗')],
        'cleaning': [('sterilizing', '送灭菌')],
        'sterilizing': [('pending_release', '待放行')],
        'pending_release': [('registered', '放行入库')],
        'expired': [('recalled', '发起召回')],
        'recalled': [('cleaning', '重新清洗')],
    }

    new_status = forms.ChoiceField(label='目标状态')
    notes = forms.CharField(label='备注', required=False, widget=forms.Textarea(attrs={'rows': 2}))

    def __init__(self, *args, current_status=None, **kwargs):
        super().__init__(*args, **kwargs)
        if current_status and current_status in self.STATUS_TRANSITIONS:
            self.fields['new_status'].choices = self.STATUS_TRANSITIONS[current_status]
        else:
            self.fields['new_status'].choices = []
