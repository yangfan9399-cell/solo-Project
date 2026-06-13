import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const [statsRes, recordsRes] = await Promise.all([
		fetch('/api/stats'),
		fetch('/api/records?limit=100')
	]);
	const stats = await statsRes.json();
	const records = await recordsRes.json();
	return { stats, records };
};
