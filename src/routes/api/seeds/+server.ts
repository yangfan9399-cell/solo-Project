import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSeedSamples } from '$lib/store';

export const GET: RequestHandler = async () => {
	const samples = getSeedSamples();
	return json(samples);
};
