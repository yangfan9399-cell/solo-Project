from django import forms
from .models import InspectionRecord, CrystallizationPool, AnomalyAlert


class InspectionRecordForm(forms.ModelForm):
    class Meta:
        model = InspectionRecord
        exclude = ('created_by', 'has_anomaly', 'version', 'is_latest')
        widgets = {
            'inspection_date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'inspection_time': forms.TimeInput(attrs={'type': 'time', 'class': 'form-control'}),
            'pool': forms.Select(attrs={'class': 'form-control'}),
            'inspector': forms.TextInput(attrs={'class': 'form-control'}),
            'batch_no': forms.TextInput(attrs={'class': 'form-control'}),
            'brine_concentration': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'brine_depth_cm': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1'}),
            'crystal_thickness_mm': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1'}),
            'surface_status': forms.Select(attrs={'class': 'form-control'}),
            'weather_type': forms.Select(attrs={'class': 'form-control'}),
            'temperature': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1'}),
            'humidity': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1'}),
            'wind_level': forms.Select(attrs={'class': 'form-control'}),
            'wind_direction': forms.TextInput(attrs={'class': 'form-control'}),
            'salt_yield': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.001'}),
            'cumulative_yield': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.001'}),
            'ph_value': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'impurity_level': forms.Select(attrs={'class': 'form-control'}),
            'anomaly_description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'handling_measures': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'remarks': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


class CrystallizationPoolForm(forms.ModelForm):
    class Meta:
        model = CrystallizationPool
        fields = '__all__'
        widgets = {
            'pool_code': forms.TextInput(attrs={'class': 'form-control'}),
            'pool_name': forms.TextInput(attrs={'class': 'form-control'}),
            'pool_group': forms.Select(attrs={'class': 'form-control'}),
            'area': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'position_x': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'position_y': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'build_date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'depth_cm': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1'}),
            'remarks': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


class AnomalyAlertForm(forms.ModelForm):
    class Meta:
        model = AnomalyAlert
        exclude = ('created_at',)
        widgets = {
            'pool': forms.Select(attrs={'class': 'form-control'}),
            'record': forms.Select(attrs={'class': 'form-control'}),
            'anomaly_type': forms.Select(attrs={'class': 'form-control'}),
            'severity': forms.Select(attrs={'class': 'form-control'}),
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'status': forms.Select(attrs={'class': 'form-control'}),
            'detected_at': forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'form-control'}),
            'resolved_at': forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'form-control'}),
            'handler': forms.TextInput(attrs={'class': 'form-control'}),
            'resolution': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
        }


class InspectionFilterForm(forms.Form):
    keyword = forms.CharField(required=False, label='关键词',
                              widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '池号/批次/巡检员'}))
    pool_group = forms.ChoiceField(required=False, label='池组', choices=[('', '全部')] + list(CrystallizationPool.POOL_GROUP),
                                   widget=forms.Select(attrs={'class': 'form-control'}))
    pool_id = forms.ChoiceField(required=False, label='结晶池', choices=[('', '全部')],
                                widget=forms.Select(attrs={'class': 'form-control'}))
    date_from = forms.DateField(required=False, label='开始日期',
                                widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}))
    date_to = forms.DateField(required=False, label='结束日期',
                              widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}))
    surface_status = forms.ChoiceField(required=False, label='池面状态', choices=[('', '全部')] + list(InspectionRecord.SURFACE_STATUS),
                                       widget=forms.Select(attrs={'class': 'form-control'}))
    weather_type = forms.ChoiceField(required=False, label='天气', choices=[('', '全部')] + list(InspectionRecord.WEATHER_TYPE),
                                     widget=forms.Select(attrs={'class': 'form-control'}))
    anomaly_only = forms.BooleanField(required=False, label='仅异常',
                                      widget=forms.CheckboxInput(attrs={'class': 'form-check-input'}))
    concentration_min = forms.DecimalField(required=False, label='最低浓度(°Bé)',
                                           widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1'}))
    concentration_max = forms.DecimalField(required=False, label='最高浓度(°Bé)',
                                           widget=forms.NumberInput(attrs={'class': 'form-control', 'step': '0.1'}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        pools = CrystallizationPool.objects.all().values_list('id', 'pool_code')
        self.fields['pool_id'].choices = [('', '全部')] + [(p[0], p[1]) for p in pools]
