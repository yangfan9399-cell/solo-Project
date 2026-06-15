import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMaterials } from '$lib/store';

export const GET: RequestHandler = async () => {
	const materials = getMaterials();
	return json(materials);
};
