from django import forms
from django.core.exceptions import ValidationError
from .models import Travel, Booking, Reimbursement, HistoryNode


class TravelForm(forms.ModelForm):
    """差旅申请表单"""

    class Meta:
        model = Travel
        fields = [
            'destination_city', 'purpose', 'estimated_budget',
            'start_date', 'end_date'
        ]
        widgets = {
            'destination_city': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '请输入目的地城市'
            }),
            'purpose': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': '请输入出差事由'
            }),
            'estimated_budget': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '请输入预计预算'
            }),
            'start_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'end_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
        }

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')

        if start_date and end_date:
            if end_date < start_date:
                raise ValidationError('结束日期不能早于开始日期')

        return cleaned_data


class BookingForm(forms.ModelForm):
    """行程预订表单"""

    class Meta:
        model = Booking
        fields = [
            'flight_info', 'hotel_info', 'actual_cost',
            'over_budget_reason', 'over_budget_reason_text', 'booking_status'
        ]
        widgets = {
            'flight_info': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': '如：航班号 CA1234，起飞时间 08:00，票价 800元'
            }),
            'hotel_info': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': '如：酒店名称 如家酒店，入住 3晚，单价 400元/晚'
            }),
            'actual_cost': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '请输入实际总费用'
            }),
            'over_budget_reason': forms.Select(attrs={
                'class': 'form-select'
            }),
            'over_budget_reason_text': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': '请说明超标原因'
            }),
            'booking_status': forms.Select(attrs={
                'class': 'form-select'
            }),
        }

    def clean(self):
        cleaned_data = super().clean()
        actual_cost = cleaned_data.get('actual_cost')
        estimated_budget = self.instance.travel.estimated_budget if self.instance else None

        if estimated_budget and actual_cost and actual_cost > estimated_budget:
            over_budget_reason = cleaned_data.get('over_budget_reason')
            if not over_budget_reason:
                raise ValidationError('实际费用超过预算时，必须选择超标原因')

        return cleaned_data


class ReimbursementForm(forms.ModelForm):
    """报销单表单"""

    class Meta:
        model = Reimbursement
        fields = [
            'has_flight_receipt', 'has_hotel_receipt',
            'has_meal_receipt', 'has_meal_expense',
            'missing_receipts', 'finance_comments', 'review_status'
        ]
        widgets = {
            'has_flight_receipt': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'has_hotel_receipt': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'has_meal_receipt': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'has_meal_expense': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
            'missing_receipts': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': '请列出缺失的票据'
            }),
            'finance_comments': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': '请输入财务复核意见'
            }),
            'review_status': forms.Select(attrs={
                'class': 'form-select'
            }),
        }


class ApprovalForm(forms.Form):
    """审批表单"""
    APPROVAL_CHOICES = [
        ('approve', '审批通过'),
        ('reject', '审批驳回'),
    ]

    action = forms.ChoiceField(choices=APPROVAL_CHOICES, widget=forms.RadioSelect(attrs={
        'class': 'btn-check'
    }))
    comment = forms.CharField(required=False, widget=forms.Textarea(attrs={
        'class': 'form-control',
        'rows': 3,
        'placeholder': '请输入审批意见（驳回时必填）'
    }))

    def clean(self):
        cleaned_data = super().clean()
        action = cleaned_data.get('action')
        comment = cleaned_data.get('comment')

        if action == 'reject' and not comment:
            raise ValidationError('驳回申请时必须填写原因')

        return cleaned_data
