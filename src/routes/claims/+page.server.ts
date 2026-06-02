import type { PageServerLoad } from './$types';
import { getClaims } from '$lib/server/services';
import type { ClaimStatus } from '$lib/types';

export const load: PageServerLoad = function ({ url }) {
	const status = url.searchParams.get('status') as ClaimStatus | undefined;
	const page = parseInt(url.searchParams.get('page') || '1');

	return {
		claims: getClaims({ status, page }),
		filters: { status, page }
	};
};
