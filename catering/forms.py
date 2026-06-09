from django import forms
from .models import MealBatch, TemperatureRecord, RecallRecord, Allergen


class BatchCreateForm(forms.ModelForm):
    class Meta:
        model = MealBatch
        fields = [
            'batch_number', 'meal_category', 'flight', 'quantity',
            'production_time', 'shelf_life_hours', 'allergens', 'remarks'
        ]
        widgets = {
            'production_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'allergens': forms.CheckboxSelectMultiple(),
            'remarks': forms.Textarea(attrs={'rows': 3}),
        }


class QCForm(forms.Form):
    allergen_label_verified = forms.BooleanField(
        required=False,
        label='过敏源标识已复核',
        widget=forms.CheckboxInput()
    )
    allergen_label_missing = forms.BooleanField(
        required=False,
        label='过敏源标识缺失',
        widget=forms.CheckboxInput()
    )
    temperature = forms.DecimalField(
        max_digits=5,
        decimal_places=2,
        label='当前温度（℃）',
        widget=forms.NumberInput(attrs={'step': '0.1'})
    )
    qc_passed = forms.BooleanField(
        required=False,
        label='品控通过',
        widget=forms.CheckboxInput()
    )
    remarks = forms.CharField(
        required=False,
        label='品控备注',
        widget=forms.Textarea(attrs={'rows': 3})
    )


class LoadConfirmForm(forms.Form):
    temperature = forms.DecimalField(
        max_digits=5,
        decimal_places=2,
        label='装机前温度（℃）',
        widget=forms.NumberInput(attrs={'step': '0.1'})
    )
    remarks = forms.CharField(
        required=False,
        label='装机备注',
        widget=forms.Textarea(attrs={'rows': 2})
    )


class RecallForm(forms.ModelForm):
    class Meta:
        model = RecallRecord
        fields = ['reason', 'anomaly_type']
        widgets = {
            'reason': forms.Textarea(attrs={'rows': 3}),
        }


class RecallResolveForm(forms.Form):
    resolution = forms.CharField(
        label='处理结果',
        widget=forms.Textarea(attrs={'rows': 4})
    )
    return_to_inventory = forms.BooleanField(
        required=False,
        label='退回仓库（重新安排）',
        widget=forms.CheckboxInput()
    )


class TemperatureRecordForm(forms.ModelForm):
    class Meta:
        model = TemperatureRecord
        fields = ['temperature', 'location']
        widgets = {
            'temperature': forms.NumberInput(attrs={'step': '0.1'}),
        }


class BatchFilterForm(forms.Form):
    STATUS_CHOICES = [('', '全部状态')] + MealBatch._meta.get_field('status').choices
    ANOMALY_CHOICES = [('', '全部异常类型')] + MealBatch._meta.get_field('anomaly_type').choices

    status = forms.ChoiceField(choices=STATUS_CHOICES, required=False, label='状态')
    anomaly_type = forms.ChoiceField(choices=ANOMALY_CHOICES, required=False, label='异常类型')
    keyword = forms.CharField(required=False, label='关键词', widget=forms.TextInput(attrs={'placeholder': '批次号/航班号'}))
    date_from = forms.DateField(required=False, label='起始日期', widget=forms.DateInput(attrs={'type': 'date'}))
    date_to = forms.DateField(required=False, label='结束日期', widget=forms.DateInput(attrs={'type': 'date'}))
