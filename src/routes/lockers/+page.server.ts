import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getLockers, getItems, setLockerStatus } from '$lib/server/services';

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

export const actions: Actions = {
	set_maintenance: async ({ request }) => {
		const form = await request.formData();
		const lockerId = parseInt(form.get('lockerId') as string);
		const reason = (form.get('reason') as string)?.trim() || '';

		if (isNaN(lockerId)) {
			return fail(400, { error: '无效的柜位编号' });
		}

		try {
			setLockerStatus(lockerId, 'maintenance', 1, reason);
			return { success: true };
		} catch (e) {
			const message = e instanceof Error ? e.message : '标记维护失败';
			return fail(400, { error: message });
		}
	},

	set_available: async ({ request }) => {
		const form = await request.formData();
		const lockerId = parseInt(form.get('lockerId') as string);
		const reason = (form.get('reason') as string)?.trim() || '';

		if (isNaN(lockerId)) {
			return fail(400, { error: '无效的柜位编号' });
		}

		try {
			setLockerStatus(lockerId, 'available', 1, reason);
			return { success: true };
		} catch (e) {
			const message = e instanceof Error ? e.message : '恢复可用失败';
			return fail(400, { error: message });
		}
	}
};
