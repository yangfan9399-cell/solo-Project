from django import forms
from .models import Procurement, Acceptance, Invoice, Supplier


class ProcurementForm(forms.ModelForm):
    class Meta:
        model = Procurement
        fields = [
            'title', 'project', 'budget_subject', 'supplier',
            'amount', 'equipment_name', 'equipment_model',
            'equipment_params', 'purpose'
        ]
        widgets = {
            'equipment_params': forms.Textarea(attrs={'rows': 4}),
            'purpose': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'


class AcceptanceForm(forms.ModelForm):
    class Meta:
        model = Acceptance
        fields = ['acceptance_date', 'actual_params', 'passed', 'remarks']
        widgets = {
            'actual_params': forms.Textarea(attrs={'rows': 4}),
            'remarks': forms.Textarea(attrs={'rows': 2}),
            'acceptance_date': forms.DateInput(attrs={'type': 'date'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != 'passed':
                field.widget.attrs['class'] = 'form-control'


class InvoiceForm(forms.ModelForm):
    class Meta:
        model = Invoice
        fields = ['invoice_no', 'invoice_date', 'title', 'amount', 'tax_amount']
        widgets = {
            'invoice_date': forms.DateInput(attrs={'type': 'date'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'


class SupplierForm(forms.ModelForm):
    class Meta:
        model = Supplier
        fields = ['name', 'tax_no', 'contact_person', 'phone', 'address', 'bank_account']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'
