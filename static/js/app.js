document.addEventListener('DOMContentLoaded', function() {
    htmx.on('htmx:afterRequest', function(evt) {
        const detail = evt.detail;
        if (detail.xhr && detail.xhr.status === 200) {
            const modalEl = document.querySelector('.modal.show');
            if (modalEl) {
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) {
                    modal.hide();
                }
            }
        }
    });

    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    toastElList.map(function(toastEl) {
        return new bootstrap.Toast(toastEl);
    });

    document.querySelectorAll('input[type="date"], input[type="datetime-local"]').forEach(function(input) {
        if (!input.value && input.hasAttribute('data-default-now')) {
            const now = new Date();
            if (input.type === 'date') {
                input.value = now.toISOString().split('T')[0];
            } else {
                input.value = now.toISOString().slice(0, 16);
            }
        }
    });
});
