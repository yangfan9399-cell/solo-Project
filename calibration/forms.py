from django import forms
from .models import Station, Instrument, CalibrationBatch, CalibrationRecord, TransportRecord, Certificate


class StationForm(forms.ModelForm):
    class Meta:
        model = Station
        fields = ['name', 'code', 'altitude', 'latitude', 'longitude',
                  'region', 'status', 'established_date', 'notes']
        widgets = {
            'notes': forms.Textarea(attrs={'rows': 3}),
            'region': forms.Select(attrs={'class': 'form-select'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
        }


class InstrumentForm(forms.ModelForm):
    class Meta:
        model = Instrument
        fields = ['station', 'instrument_type', 'model_name', 'serial_number',
                  'manufacturer', 'install_date', 'status',
                  'last_calibration_date', 'next_calibration_due']
        widgets = {
            'instrument_type': forms.Select(attrs={'class': 'form-select'}),
            'status': forms.Select(attrs={'class': 'form-select'}),
        }


class CalibrationBatchForm(forms.ModelForm):
    class Meta:
        model = CalibrationBatch
        fields = ['batch_number', 'calibration_date', 'operator',
                  'lab_location', 'temperature_env', 'humidity_env', 'notes']
        widgets = {
            'calibration_date': forms.DateInput(attrs={'type': 'date'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }


class CalibrationRecordForm(forms.ModelForm):
    class Meta:
        model = CalibrationRecord
        fields = ['instrument', 'batch', 'test_point', 'before_value',
                  'after_value', 'standard_value', 'tolerance', 'result',
                  'is_anomaly', 'anomaly_note', 'notes']
        widgets = {
            'result': forms.Select(attrs={'class': 'form-select'}),
            'anomaly_note': forms.Textarea(attrs={'rows': 2}),
            'notes': forms.Textarea(attrs={'rows': 2}),
        }


class TransportRecordForm(forms.ModelForm):
    class Meta:
        model = TransportRecord
        fields = ['instrument', 'from_station', 'to_station', 'transport_date',
                  'arrival_date', 'method', 'impact_score',
                  'pre_transport_reading', 'post_transport_reading', 'notes']
        widgets = {
            'transport_date': forms.DateInput(attrs={'type': 'date'}),
            'arrival_date': forms.DateInput(attrs={'type': 'date'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }


class CertificateForm(forms.ModelForm):
    class Meta:
        model = Certificate
        fields = ['certificate_number', 'record', 'issued_date',
                  'expiry_date', 'issued_by', 'is_valid', 'notes']
        widgets = {
            'issued_date': forms.DateInput(attrs={'type': 'date'}),
            'expiry_date': forms.DateInput(attrs={'type': 'date'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }


class CalibrationFilterForm(forms.Form):
    q = forms.CharField(required=False, label='搜索', widget=forms.TextInput(attrs={
        'class': 'form-control', 'placeholder': '搜索仪器序列号/测试点...'
    }))
    instrument_type = forms.ChoiceField(required=False, label='仪器类型', choices=[('', '全部')] + Instrument.TYPE_CHOICES,
                                         widget=forms.Select(attrs={'class': 'form-select'}))
    result = forms.ChoiceField(required=False, label='校准结果', choices=[('', '全部')] + CalibrationRecord.RESULT_CHOICES,
                                widget=forms.Select(attrs={'class': 'form-select'}))
    is_anomaly = forms.ChoiceField(required=False, label='异常', choices=[('', '全部'), ('1', '异常'), ('0', '正常')],
                                    widget=forms.Select(attrs={'class': 'form-select'}))
    batch = forms.CharField(required=False, label='批次号', widget=forms.TextInput(attrs={
        'class': 'form-control', 'placeholder': '批次号'
    }))
    date_from = forms.DateField(required=False, label='开始日期', widget=forms.DateInput(attrs={
        'type': 'date', 'class': 'form-control'
    }))
    date_to = forms.DateField(required=False, label='结束日期', widget=forms.DateInput(attrs={
        'type': 'date', 'class': 'form-control'
    }))
