import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { getItemById, getLockers, storeItem, getActivityLogs, updateItemStatus, createClaim } from '$lib/server/services';
import type { IdType } from '$lib/types';

export const load: PageServerLoad = function ({ params }) {
	const item = getItemById(parseInt(params.id));
	if (!item) {
		throw error(404, '物品不存在');
	}

	const availableLockers = getLockers().filter((l) => l.status === 'available');
	const logs = getActivityLogs(parseInt(params.id));

	return {
		item,
		availableLockers,
		activityLogs: logs
	};
};

export const actions: Actions = {
	store: async ({ request, params }) => {
		const form = await request.formData();
		const lockerId = parseInt(form.get('lockerId') as string);
		const storedBy = 1;

		try {
			storeItem(parseInt(params.id), lockerId, storedBy);
			return redirect(303, `/items/${params.id}`);
		} catch (e) {
			return fail(500, { error: '存入保管柜失败' });
		}
	},

	setException: async ({ request, params }) => {
		const form = await request.formData();
		const note = form.get('note') as string;
		const userId = 1;

		try {
			updateItemStatus(parseInt(params.id), 'exception', userId, note);
			return redirect(303, `/items/${params.id}`);
		} catch (e) {
			return fail(500, { error: '标记异常失败' });
		}
	},

	createClaim: async ({ request, params }) => {
		const form = await request.formData();
		const claimantName = form.get('claimantName') as string;
		const claimantPhone = form.get('claimantPhone') as string;
		const claimantIdType = form.get('claimantIdType') as IdType | '';
		const claimantIdNumber = form.get('claimantIdNumber') as string;

		if (!claimantName || !claimantPhone) {
			return fail(400, { error: '姓名和电话必填' });
		}

		try {
			const claim = createClaim({
				item_id: parseInt(params.id),
				claimant_name: claimantName,
				claimant_phone: claimantPhone,
				claimant_id_type: claimantIdType || undefined,
				claimant_id_number: claimantIdNumber
			});
			return redirect(303, `/claims/${claim.id}`);
		} catch (e) {
			return fail(500, { error: '创建申领记录失败' });
		}
	}
};
