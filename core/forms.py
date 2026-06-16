from django import forms
from .models import CoreSample, CuttingTask, BatchVersion, AnomalyRecord


class CoreSampleForm(forms.ModelForm):
    class Meta:
        model = CoreSample
        fields = [
            'sample_no', 'well_name', 'depth_start', 'depth_end',
            'total_length', 'remaining_length', 'lithology', 'formation',
            'priority', 'status', 'storage_location', 'collected_date',
            'description'
        ]
        widgets = {
            'collected_date': forms.DateInput(attrs={'type': 'date'}),
            'description': forms.Textarea(attrs={'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-input'


class CuttingTaskForm(forms.ModelForm):
    class Meta:
        model = CuttingTask
        fields = [
            'task_no', 'core_sample', 'cutter', 'purpose', 'status',
            'planned_cut_length', 'actual_cut_length', 'loss_length',
            'slice_count', 'slice_thickness',
            'scheduled_date', 'scheduled_start_time', 'scheduled_end_time',
            'actual_start_time', 'actual_end_time',
            'operator', 'quality_checked', 'quality_result',
            'batch_version', 'remarks'
        ]
        widgets = {
            'scheduled_date': forms.DateInput(attrs={'type': 'date'}),
            'scheduled_start_time': forms.TimeInput(attrs={'type': 'time'}),
            'scheduled_end_time': forms.TimeInput(attrs={'type': 'time'}),
            'actual_start_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'actual_end_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'remarks': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            if isinstance(field.widget, (forms.TextInput, forms.Select, forms.NumberInput,
                                         forms.DateInput, forms.TimeInput, forms.DateTimeInput,
                                         forms.Textarea)):
                field.widget.attrs['class'] = 'form-input'
            elif isinstance(field.widget, forms.CheckboxInput):
                field.widget.attrs['class'] = 'form-checkbox'


class BatchVersionForm(forms.ModelForm):
    class Meta:
        model = BatchVersion
        fields = ['batch_no', 'batch_type', 'description', 'created_by']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            if isinstance(field.widget, (forms.TextInput, forms.Select, forms.Textarea)):
                field.widget.attrs['class'] = 'form-input'


class AnomalyResolveForm(forms.Form):
    resolution = forms.CharField(
        label='解决方案',
        widget=forms.Textarea(attrs={'rows': 4, 'class': 'form-input'}),
        required=False
    )
