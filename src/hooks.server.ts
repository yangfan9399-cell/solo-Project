import { initializeSeedData } from '$lib/server/seed';

initializeSeedData();

export async function handle({ event, resolve }) {
	const response = await resolve(event);
	return response;
}
