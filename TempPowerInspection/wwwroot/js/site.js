// Site JavaScript

// DataTable defaults
$.extend(true, $.fn.dataTable.defaults, {
    language: {
        url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/zh-Hans.json'
    },
    responsive: true
});

// Confirm delete
document.addEventListener('DOMContentLoaded', function () {
    const deleteForms = document.querySelectorAll('form[action*="Delete"]');
    deleteForms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
            if (!confirm('确定要删除吗？此操作不可恢复。')) {
                e.preventDefault();
            }
        });
    });
});

// Power on confirmation
document.addEventListener('DOMContentLoaded', function () {
    const powerOnForms = document.querySelectorAll('form[action*="PowerOn"]');
    powerOnForms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
            if (!confirm('确定要送电吗？确认前请确保所有安全隐患已排除。')) {
                e.preventDefault();
            }
        });
    });
});

// Auto-hide alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function () {
    const alerts = document.querySelectorAll('.alert:not(.alert-danger):not(.alert-warning)');
    alerts.forEach(function (alert) {
        setTimeout(function () {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});

// Photo preview
document.addEventListener('DOMContentLoaded', function () {
    const photoInputs = document.querySelectorAll('input[name*="Photos"]');
    photoInputs.forEach(function (input) {
        input.addEventListener('change', function () {
            const photos = this.value.split(',').filter(p => p.trim());
            console.log('Photos entered:', photos.length);
        });
    });
});
