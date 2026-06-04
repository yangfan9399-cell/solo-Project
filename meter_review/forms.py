from django import forms
from .models import FieldNote, FeeAdjustment


class FieldNoteForm(forms.ModelForm):
    class Meta:
        model = FieldNote
        fields = ['note', 'photo']
        widgets = {
            'note': forms.Textarea(attrs={
                'class': 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                'rows': 4,
                'placeholder': '请输入现场说明...'
            }),
            'photo': forms.FileInput(attrs={
                'class': 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
            }),
        }
        labels = {
            'note': '现场说明',
            'photo': '现场照片（可选）',
        }


class FeeAdjustmentForm(forms.Form):
    new_reading = forms.DecimalField(
        label='调整后读数',
        max_digits=12,
        decimal_places=2,
        min_value=0,
        widget=forms.NumberInput(attrs={
            'class': 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
            'step': '0.01'
        })
    )
    adjustment_reason = forms.CharField(
        label='调整原因',
        widget=forms.Textarea(attrs={
            'class': 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
            'rows': 3,
            'placeholder': '请详细说明调整原因...'
        })
    )


class AssignForm(forms.Form):
    remark = forms.CharField(
        label='备注（可选）',
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
            'placeholder': '请输入备注信息...'
        })
    )
