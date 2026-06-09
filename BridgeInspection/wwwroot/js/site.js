document.addEventListener('DOMContentLoaded', function () {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
    if (typeof bootstrap !== 'undefined') {
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    var datetimeInputs = document.querySelectorAll('input[type="datetime-local"]');
    datetimeInputs.forEach(function (input) {
        if (!input.value) {
            var now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            input.value = now.toISOString().slice(0, 16);
        }
    });

    var approveRadio = document.getElementById('approve');
    if (approveRadio) {
        approveRadio.addEventListener('change', function () {
            if (this.checked) {
                this.closest('.form-check').classList.add('text-success');
            }
        });
    }

    var rejectRadio = document.getElementById('reject');
    if (rejectRadio) {
        rejectRadio.addEventListener('change', function () {
            if (this.checked) {
                this.closest('.form-check').classList.add('text-danger');
            }
        });
    }

    var forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
            var submitBtns = form.querySelectorAll('button[type="submit"]');
            submitBtns.forEach(function (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span>处理中...';
            });
        });
    });
});

function confirmDelete(message) {
    return confirm(message || '确定要执行此操作吗？');
}
