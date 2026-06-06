from django import forms
from .models import (
    InspectionAppointment, Container, Document, FeeItem,
    RescheduleRecord, DocumentType,
)


class AppointmentForm(forms.ModelForm):
    container_no = forms.CharField(max_length=20, label='箱号')
    container_size = forms.ChoiceField(choices=[], label='箱型')
    vessel_name = forms.CharField(max_length=100, label='船名')
    voyage_no = forms.CharField(max_length=30, label='航次')
    bl_no = forms.CharField(max_length=50, required=False, label='提单号')

    class Meta:
        model = InspectionAppointment
        fields = [
            'container_no', 'container_size', 'vessel_name', 'voyage_no', 'bl_no',
            'forwarder', 'shipping_line', 'route', 'inspection_window',
            'appointment_date', 'appointment_time', 'contact_person',
            'contact_phone', 'inspection_reason',
        ]
        widgets = {
            'appointment_date': forms.DateInput(attrs={'type': 'date'}),
            'appointment_time': forms.TimeInput(attrs={'type': 'time'}),
            'inspection_reason': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from .models import ContainerSize
        self.fields['container_size'].choices = ContainerSize.choices

        if self.instance and self.instance.pk and self.instance.container:
            container = self.instance.container
            self.fields['container_no'].initial = container.container_no
            self.fields['container_size'].initial = container.size
            self.fields['vessel_name'].initial = container.vessel_name
            self.fields['voyage_no'].initial = container.voyage_no
            self.fields['bl_no'].initial = container.bl_no


class InspectionResultForm(forms.Form):
    inspection_result = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 4}),
        label='查验结果说明',
        required=False,
    )


class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ['document_type', 'is_submitted', 'remark']
        widgets = {
            'remark': forms.Textarea(attrs={'rows': 2}),
        }

    def __init__(self, *args, appointment=None, **kwargs):
        super().__init__(*args, **kwargs)
        if appointment:
            existing_types = appointment.documents.values_list('document_type_id', flat=True)
            if self.instance.pk:
                existing_types = existing_types.exclude(pk=self.instance.pk)
            self.fields['document_type'].queryset = DocumentType.objects.exclude(
                id__in=existing_types
            )
        else:
            self.fields['document_type'].queryset = DocumentType.objects.all()


class RescheduleForm(forms.ModelForm):
    class Meta:
        model = RescheduleRecord
        fields = ['new_date', 'new_time', 'reason']
        widgets = {
            'new_date': forms.DateInput(attrs={'type': 'date'}),
            'new_time': forms.TimeInput(attrs={'type': 'time'}),
            'reason': forms.Textarea(attrs={'rows': 3}),
        }
        labels = {
            'new_date': '新预约日期',
            'new_time': '新预约时间',
            'reason': '改期原因',
        }


class FeeReviewForm(forms.Form):
    fee_reduction = forms.DecimalField(
        max_digits=10, decimal_places=2,
        required=False,
        label='减免金额(元)',
        min_value=0,
    )
    reduction_reason = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 2}),
        required=False,
        label='减免说明',
    )
    action = forms.ChoiceField(
        choices=[
            ('confirm', '确认费用'),
            ('reduce', '减免后确认'),
            ('dispute', '提出异议'),
        ],
        widget=forms.HiddenInput(),
    )
    dispute_reason = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 3}),
        required=False,
        label='异议原因',
    )


class FeeItemForm(forms.ModelForm):
    class Meta:
        model = FeeItem
        fields = ['item_name', 'quantity', 'unit_price', 'is_reduction', 'remark']
        widgets = {
            'remark': forms.Textarea(attrs={'rows': 2}),
        }


class StatisticsForm(forms.Form):
    start_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label='开始日期',
    )
    end_date = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={'type': 'date'}),
        label='结束日期',
    )
    group_by = forms.ChoiceField(
        choices=[
            ('route', '按航线'),
            ('forwarder', '按货代'),
            ('anomaly_type', '按异常类型'),
            ('demurrage_days', '按滞箱天数'),
        ],
        required=False,
        label='统计维度',
    )
