import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getOverdueItems, disposeItem } from '$lib/server/services';

export const load: PageServerLoad = function () {
	return {
		items: getOverdueItems()
	};
};

export const actions: Actions = {
	dispose: async ({ request }) => {
		const form = await request.formData();
		const itemId = parseInt(form.get('itemId') as string);
		const reason = form.get('reason') as string;

		if (!reason) {
			return fail(400, { error: '请填写处置原因' });
		}

		try {
			disposeItem(itemId, 1, reason);
			return redirect(303, '/overdue');
		} catch (e) {
			return fail(500, { error: '处置失败' });
		}
	}
};
