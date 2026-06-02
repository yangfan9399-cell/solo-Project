import type { PageServerLoad, Actions } from './$types';
import { getItems, getHalls, storeItem } from '$lib/server/services';
import type { ItemCategory, ItemStatus } from '$lib/types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = function ({ url }) {
	const status = url.searchParams.get('status') as ItemStatus | undefined;
	const category = url.searchParams.get('category') as ItemCategory | undefined;
	const search = url.searchParams.get('search') || undefined;
	const page = parseInt(url.searchParams.get('page') || '1');

	return {
		items: getItems({ status, category, search, page }),
		halls: getHalls(),
		filters: { status, category, search, page }
	};
};

export const actions: Actions = {
	store: async ({ request }) => {
		const form = await request.formData();
		const itemId = parseInt(form.get('itemId') as string);
		const lockerId = parseInt(form.get('lockerId') as string);
		const storedBy = 1;

		try {
			storeItem(itemId, lockerId, storedBy);
			return redirect(303, '/items');
		} catch (e) {
			return fail(500, { error: '存入保管柜失败' });
		}
	}
};
