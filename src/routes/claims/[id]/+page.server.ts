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

	complete: async ({ request, params }) => {
		const form = await request.formData();
		const receiver = form.get('receiver') as string;
		const idLast4 = form.get('idLast4') as string;
		const voucher = form.get('voucher') as string;
		const notes = form.get('notes') as string;

		if (!receiver || receiver.trim() === '') {
			return fail(400, { error: '签收人姓名为必填项' });
		}

		const claimId = parseInt(params.id);
		if (isNaN(claimId)) {
			return fail(400, { error: '无效的申领编号' });
		}

		const claim = getClaimById(claimId);
		if (!claim) {
			return fail(404, { error: '申领记录不存在' });
		}
		if (claim.status !== 'approved') {
			return fail(400, { error: `当前状态「${claim.status}」不允许签收，仅核验通过的申领可领取` });
		}

		try {
			completeClaim(claimId, 1, {
				receiver: receiver.trim(),
				idLast4: idLast4?.trim() || '',
				voucher: voucher?.trim() || '',
				notes: notes?.trim() || ''
			});
			return redirect(303, `/claims/${params.id}`);
		} catch (e) {
			const message = e instanceof Error ? e.message : '领取签收失败';
			return fail(500, { error: message });
		}
	}
};
