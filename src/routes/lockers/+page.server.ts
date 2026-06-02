import type { PageServerLoad } from './$types';
import { getLockers, getItems } from '$lib/server/services';

export const load: PageServerLoad = function () {
	const lockers = getLockers();
	const items = getItems({ status: 'storing', pageSize: 100 });

	const lockersWithItems = lockers.map((locker) => {
		const item = items.data.find((i) => i.locker_id === locker.id);
		return { ...locker, item };
	});

	return {
		lockers: lockersWithItems,
		stats: {
			total: lockers.length,
			available: lockers.filter((l) => l.status === 'available').length,
			occupied: lockers.filter((l) => l.status === 'occupied').length,
			maintenance: lockers.filter((l) => l.status === 'maintenance').length
		}
	};
};
