import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, url }) => {
	const status = url.searchParams.get('status') || '';
	const sampleType = url.searchParams.get('sampleType') || '';
	const search = url.searchParams.get('search') || '';
	const page = url.searchParams.get('page') || '1';
	const params = new URLSearchParams();
	if (status) params.set('status', status);
	if (sampleType) params.set('sampleType', sampleType);
	if (search) params.set('search', search);
	params.set('page', page);
	params.set('limit', '20');
	const res = await fetch(`/api/records?${params}`);
	const data = await res.json();
	return { data, filters: { status, sampleType, search, page: parseInt(page) } };
};
