const baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:8000';

export default function route(name, params = {}) {
    const routes = {
        'home': `${baseUrl}/`,
        'login': `${baseUrl}/login`,
        'logout': `${baseUrl}/logout`,
        'dashboard': `${baseUrl}/dashboard`,
        'waste-batches.index': `${baseUrl}/waste-batches`,
        'waste-batches.create': `${baseUrl}/waste-batches/create`,
        'waste-batches.store': `${baseUrl}/waste-batches`,
        'waste-batches.show': (id) => `${baseUrl}/waste-batches/${id}`,
        'transfer-requests.index': `${baseUrl}/transfer-requests`,
        'transfer-requests.create': `${baseUrl}/transfer-requests/create`,
        'transfer-requests.store': `${baseUrl}/transfer-requests`,
        'transfer-requests.show': (id) => `${baseUrl}/transfer-requests/${id}`,
        'transfer-requests.update-carrier': (id) => `${baseUrl}/transfer-requests/${id}/update-carrier`,
        'manifest-forms.create': (id) => `${baseUrl}/transfer-requests/${id}/manifest/create`,
        'manifest-forms.store': `${baseUrl}/manifest-forms`,
        'manifest-forms.verify': (id) => `${baseUrl}/manifest-forms/${id}/verify`,
        'reviews.store': `${baseUrl}/reviews`,
    };

    const routeValue = routes[name];
    
    if (typeof routeValue === 'function') {
        if (typeof params === 'object') {
            return routeValue(Object.values(params)[0]);
        }
        return routeValue(params);
    }
    
    return routeValue || '#';
}
