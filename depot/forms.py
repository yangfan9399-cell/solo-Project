from django import forms
from .models import (
    Package, PickupReminder, AbnormalPackage,
    Complaint, Responsibility, ReturnRecord,
)


class PackageCheckinForm(forms.ModelForm):
    class Meta:
        model = Package
        fields = [
            "tracking_number", "sender_name", "sender_phone",
            "receiver_name", "receiver_phone", "station",
            "shelf_code", "carrier", "remark",
        ]
        widgets = {
            "tracking_number": forms.TextInput(attrs={"class": "form-input", "placeholder": "请输入快递单号"}),
            "sender_name": forms.TextInput(attrs={"class": "form-input", "placeholder": "寄件人姓名"}),
            "sender_phone": forms.TextInput(attrs={"class": "form-input", "placeholder": "寄件人电话"}),
            "receiver_name": forms.TextInput(attrs={"class": "form-input", "placeholder": "收件人姓名"}),
            "receiver_phone": forms.TextInput(attrs={"class": "form-input", "placeholder": "收件人电话"}),
            "shelf_code": forms.TextInput(attrs={"class": "form-input", "placeholder": "如 A-01-03"}),
            "remark": forms.Textarea(attrs={"class": "form-input", "rows": 3, "placeholder": "备注信息"}),
            "station": forms.Select(attrs={"class": "form-input"}),
            "carrier": forms.Select(attrs={"class": "form-input"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["station"].required = True
        self.fields["carrier"].required = True


class PickupReminderForm(forms.ModelForm):
    class Meta:
        model = PickupReminder
        fields = ["reminder_type", "note"]
        widgets = {
            "reminder_type": forms.Select(attrs={"class": "form-input"}),
            "note": forms.Textarea(attrs={"class": "form-input", "rows": 2, "placeholder": "备注"}),
        }


class PickupReminderResponseForm(forms.ModelForm):
    class Meta:
        model = PickupReminder
        fields = ["response"]
        widgets = {
            "response": forms.Select(attrs={"class": "form-input"}),
        }


class AbnormalPackageForm(forms.ModelForm):
    class Meta:
        model = AbnormalPackage
        fields = ["package", "abnormal_type", "description"]
        widgets = {
            "package": forms.Select(attrs={"class": "form-input"}),
            "abnormal_type": forms.Select(attrs={"class": "form-input"}),
            "description": forms.Textarea(attrs={"class": "form-input", "rows": 4, "placeholder": "请描述异常情况"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["package"].required = True
        self.fields["package"].queryset = Package.objects.exclude(
            status__in=["picked_up", "returned"]
        ).select_related("station").order_by("-checked_in_at")
        self.fields["package"].label = "关联包裹 *"
        self.fields["package"].empty_label = "请选择包裹"


class AbnormalResolveForm(forms.ModelForm):
    class Meta:
        model = AbnormalPackage
        fields = ["status", "resolution"]
        widgets = {
            "status": forms.Select(attrs={"class": "form-input"}),
            "resolution": forms.Textarea(attrs={"class": "form-input", "rows": 4, "placeholder": "处理结果"}),
        }


class ComplaintCreateForm(forms.ModelForm):
    class Meta:
        model = Complaint
        fields = [
            "complainant_name", "complainant_phone",
            "complaint_type", "description", "station", "package",
        ]
        widgets = {
            "complainant_name": forms.TextInput(attrs={"class": "form-input", "placeholder": "投诉人姓名"}),
            "complainant_phone": forms.TextInput(attrs={"class": "form-input", "placeholder": "投诉人电话"}),
            "complaint_type": forms.Select(attrs={"class": "form-input"}),
            "description": forms.Textarea(attrs={"class": "form-input", "rows": 4, "placeholder": "投诉内容"}),
            "station": forms.Select(attrs={"class": "form-input"}),
            "package": forms.Select(attrs={"class": "form-input"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["package"].required = False


class ComplaintProcessForm(forms.ModelForm):
    class Meta:
        model = Complaint
        fields = ["status", "resolution", "satisfaction"]
        widgets = {
            "status": forms.Select(attrs={"class": "form-input"}),
            "resolution": forms.Textarea(attrs={"class": "form-input", "rows": 4, "placeholder": "处理结果"}),
            "satisfaction": forms.NumberInput(attrs={"class": "form-input", "min": 1, "max": 5, "placeholder": "1-5分"}),
        }


class ResponsibilityForm(forms.ModelForm):
    class Meta:
        model = Responsibility
        fields = [
            "responsible_staff", "responsibility_type",
            "penalty_type", "penalty_amount", "description",
        ]
        widgets = {
            "responsible_staff": forms.Select(attrs={"class": "form-input"}),
            "responsibility_type": forms.Select(attrs={"class": "form-input"}),
            "penalty_type": forms.Select(attrs={"class": "form-input"}),
            "penalty_amount": forms.NumberInput(attrs={"class": "form-input", "placeholder": "罚款金额(元)", "step": "0.01"}),
            "description": forms.Textarea(attrs={"class": "form-input", "rows": 4, "placeholder": "责任说明"}),
        }


class ReturnRecordForm(forms.ModelForm):
    class Meta:
        model = ReturnRecord
        fields = [
            "return_reason", "returned_to",
            "return_carrier", "return_tracking", "remark",
        ]
        widgets = {
            "return_reason": forms.Select(attrs={"class": "form-input"}),
            "returned_to": forms.TextInput(attrs={"class": "form-input", "placeholder": "退回目的地地址"}),
            "return_carrier": forms.TextInput(attrs={"class": "form-input", "placeholder": "退回承运商"}),
            "return_tracking": forms.TextInput(attrs={"class": "form-input", "placeholder": "退回快递单号"}),
            "remark": forms.Textarea(attrs={"class": "form-input", "rows": 3, "placeholder": "备注"}),
        }
