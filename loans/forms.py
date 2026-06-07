from django import forms
from .models import (
    LoanApplication, TransportRecord, InsurancePolicy,
    EnvironmentData, ReturnInspection, Exhibit, Borrower
)
from django.utils import timezone


class LoanApplicationForm(forms.ModelForm):
    class Meta:
        model = LoanApplication
        fields = ['exhibit', 'borrower', 'purpose', 'planned_start_date', 'planned_end_date']
        widgets = {
            'planned_start_date': forms.DateInput(attrs={'type': 'date'}),
            'planned_end_date': forms.DateInput(attrs={'type': 'date'}),
            'purpose': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['exhibit'].queryset = Exhibit.objects.filter(status='in_storage')


class TransportRecordForm(forms.ModelForm):
    class Meta:
        model = TransportRecord
        fields = [
            'route_from', 'route_to', 'transport_company',
            'vehicle_number', 'driver_name', 'driver_phone',
            'packing_method', 'estimated_departure',
            'estimated_arrival', 'notes'
        ]
        widgets = {
            'estimated_departure': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'estimated_arrival': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'notes': forms.Textarea(attrs={'rows': 3}),
        }


class InsurancePolicyForm(forms.ModelForm):
    class Meta:
        model = InsurancePolicy
        fields = [
            'policy_number', 'insurance_company', 'amount',
            'coverage_type', 'start_date', 'end_date'
        ]
        widgets = {
            'start_date': forms.DateInput(attrs={'type': 'date'}),
            'end_date': forms.DateInput(attrs={'type': 'date'}),
        }


class InsuranceReviewForm(forms.Form):
    review_notes = forms.CharField(
        label='复核意见', widget=forms.Textarea(attrs={'rows': 3}), required=False)


class EnvironmentDataForm(forms.ModelForm):
    class Meta:
        model = EnvironmentData
        fields = ['record_time', 'temperature', 'humidity', 'location', 'notes']
        widgets = {
            'record_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'notes': forms.Textarea(attrs={'rows': 2}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.initial['record_time'] = timezone.now().strftime('%Y-%m-%dT%H:%M')


class ReturnInspectionForm(forms.ModelForm):
    class Meta:
        model = ReturnInspection
        fields = ['return_date', 'condition', 'description', 'photos', 'recommendations']
        widgets = {
            'return_date': forms.DateInput(attrs={'type': 'date'}),
            'description': forms.Textarea(attrs={'rows': 4}),
            'recommendations': forms.Textarea(attrs={'rows': 3}),
            'photos': forms.Textarea(attrs={'rows': 2}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.initial['return_date'] = timezone.now().date()


class ExhibitForm(forms.ModelForm):
    class Meta:
        model = Exhibit
        fields = [
            'name', 'accession_number', 'level', 'category', 'era',
            'description', 'estimated_value',
            'temperature_min', 'temperature_max',
            'humidity_min', 'humidity_max'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }


class BorrowerForm(forms.ModelForm):
    class Meta:
        model = Borrower
        fields = ['name', 'type', 'contact_person', 'contact_phone', 'contact_email', 'address', 'credit_rating']
        widgets = {
            'address': forms.Textarea(attrs={'rows': 2}),
        }
