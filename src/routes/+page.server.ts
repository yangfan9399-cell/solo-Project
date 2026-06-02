import type { PageServerLoad } from './$types';
import { getItems, getClaims, getLockers, getOverdueItems } from '$lib/server/services';

export const load: PageServerLoad = function () {
	const storingItems = getItems({ status: 'storing', pageSize: 100 });
	const foundItems = getItems({ status: 'found', pageSize: 1 });
	const pendingClaims = getClaims({ status: 'pending', pageSize: 100 });
	const lockers = getLockers();
	const overdueItems = getOverdueItems();

	return {
		stats: {
			totalItems: storingItems.total + foundItems.total,
			storingCount: storingItems.total,
			pendingClaims: pendingClaims.total,
			overdueCount: overdueItems.length,
			lockerAvailable: lockers.filter((l) => l.status === 'available').length,
			lockerOccupied: lockers.filter((l) => l.status === 'occupied').length
		},
		recentItems: storingItems.data.slice(0, 5),
		pendingClaims: pendingClaims.data.slice(0, 5),
		overdueItems: overdueItems.slice(0, 5)
	};
};
