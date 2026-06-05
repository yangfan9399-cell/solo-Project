import { usePage } from '@inertiajs/react';

export function useRoute() {
    const { props } = usePage();
    const routes = props.routes || {};
    const appUrl = props.app_url || '';

    const buildUrl = (path, params = {}) => {
        let url = path;
        
        if (typeof params === 'object') {
            Object.keys(params).forEach(key => {
                url = url.replace(`:${key}`, params[key]);
            });
        } else if (params !== undefined) {
            url = url.replace(':id', params);
        }
        
        return appUrl + url;
    };

    const route = (name, params = {}) => {
        const parts = name.split('.');
        let current = routes;
        
        for (let i = 0; i < parts.length; i++) {
            if (current && typeof current === 'object' && parts[i] in current) {
                current = current[parts[i]];
            } else {
                return '#';
            }
        }
        
        if (typeof current === 'string') {
            return buildUrl(current, params);
        }
        
        return '#';
    };

    return route;
}

export function route(name, params = {}) {
    if (typeof window !== 'undefined' && window.inertiaRoutes) {
        const routes = window.inertiaRoutes;
        const parts = name.split('.');
        let current = routes;
        
        for (let i = 0; i < parts.length; i++) {
            if (current && typeof current === 'object' && parts[i] in current) {
                current = current[parts[i]];
            } else {
                return '#';
            }
        }
        
        if (typeof current === 'string') {
            let url = current;
            if (typeof params === 'object') {
                Object.keys(params).forEach(key => {
                    url = url.replace(`:${key}`, params[key]);
                });
            } else if (params !== undefined) {
                url = url.replace(':id', params);
            }
            return (window.inertiaAppUrl || '') + url;
        }
    }
    
    const baseUrl = (typeof window !== 'undefined' ? window.location.origin : '');
    const staticRoutes = {
        'home': '/',
        'login': '/login',
        'logout': '/logout',
        'dashboard': '/dashboard',
        'waste-batches.index': '/waste-batches',
        'waste-batches.create': '/waste-batches/create',
        'waste-batches.store': '/waste-batches',
        'waste-batches.show': (id) => `/waste-batches/${id}`,
        'transfer-requests.index': '/transfer-requests',
        'transfer-requests.create': '/transfer-requests/create',
        'transfer-requests.store': '/transfer-requests',
        'transfer-requests.show': (id) => `/transfer-requests/${id}`,
        'transfer-requests.update-carrier': (id) => `/transfer-requests/${id}/update-carrier`,
        'manifest-forms.create': (id) => `/transfer-requests/${id}/manifest/create`,
        'manifest-forms.store': '/manifest-forms',
        'manifest-forms.verify': (id) => `/manifest-forms/${id}/verify`,
        'reviews.store': '/reviews',
    };

    const routeValue = staticRoutes[name];
    if (typeof routeValue === 'function') {
        if (typeof params === 'object') {
            return baseUrl + routeValue(Object.values(params)[0]);
        }
        return baseUrl + routeValue(params);
    }
    return baseUrl + (routeValue || '#');
}

export default route;
