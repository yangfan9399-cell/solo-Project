import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { getClaimById, verifyClaim, completeClaim, getItemById, getActivityLogs } from '$lib/server/services';

export const load: PageServerLoad = function ({ params }) {
	const claim = getClaimById(parseInt(params.id));
	if (!claim) {
		throw error(404, '申领记录不存在');
	}

	const item = getItemById(claim.item_id);
	const logs = getActivityLogs(claim.item_id);

	return {
		claim,
		item,
		activityLogs: logs
	};
};

export const actions: Actions = {
	approve: async ({ params }) => {
		try {
			verifyClaim(parseInt(params.id), 1, 'approved', '身份核验通过');
			return redirect(303, `/claims/${params.id}`);
		} catch (e) {
			return fail(500, { error: '审核失败' });
		}
	},

	reject: async ({ request, params }) => {
		const form = await request.formData();
		const reason = form.get('reason') as string;

		if (!reason) {
			return fail(400, { error: '请填写拒绝原因' });
		}

		try {
			verifyClaim(parseInt(params.id), 1, 'rejected', undefined, reason);
			return redirect(303, `/claims/${params.id}`);
		} catch (e) {
			return fail(500, { error: '拒绝失败' });
		}
	},

	complete: async ({ params }) => {
		try {
			completeClaim(parseInt(params.id), 1);
			return redirect(303, `/claims/${params.id}`);
		} catch (e) {
			return fail(500, { error: '领取确认失败' });
		}
	}
};
