import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createItem, getHalls, getShowtimes } from '$lib/server/services';
import type { ItemCategory } from '$lib/types';

export const load: PageServerLoad = function () {
	return {
		halls: getHalls(),
		showtimes: getShowtimes(new Date().toISOString().split('T')[0])
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();

		const name = form.get('name') as string;
		const category = form.get('category') as ItemCategory;
		const description = form.get('description') as string;
		const color = form.get('color') as string;
		const distinguishingFeatures = form.get('distinguishingFeatures') as string;
		const hallId = form.get('hallId') as string;
		const showtimeId = form.get('showtimeId') as string;
		const foundLocation = form.get('foundLocation') as string;
		const foundTime = form.get('foundTime') as string;

		if (!name || !category || !foundTime) {
			return fail(400, { error: '请填写必填项' });
		}

		try {
			const item = createItem({
				name,
				category,
				description: description || undefined,
				color: color || undefined,
				distinguishing_features: distinguishingFeatures || undefined,
				hall_id: hallId ? parseInt(hallId) : undefined,
				showtime_id: showtimeId ? parseInt(showtimeId) : undefined,
				found_location: foundLocation || undefined,
				found_time: new Date(foundTime).toISOString(),
				finder_id: 2
			});

			return redirect(303, `/items/${item.id}`);
		} catch (e) {
			return fail(500, { error: '登记失败，请重试' });
		}
	}
};
