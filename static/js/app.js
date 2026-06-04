document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('htmx:beforeRequest', function(evt) {
        const indicator = evt.detail.elt.getAttribute('hx-indicator');
        if (indicator) {
            const el = document.querySelector(indicator);
            if (el) {
                el.classList.remove('hidden');
            }
        }
    });

    document.body.addEventListener('htmx:afterRequest', function(evt) {
        const indicator = evt.detail.elt.getAttribute('hx-indicator');
        if (indicator) {
            const el = document.querySelector(indicator);
            if (el) {
                el.classList.add('hidden');
            }
        }
    });

    document.body.addEventListener('htmx:responseError', function(evt) {
        console.error('HTMX request error:', evt.detail);
        alert('请求失败，请稍后重试');
    });
});

function formatCurrency(amount) {
    return '¥' + parseFloat(amount).toFixed(2);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
