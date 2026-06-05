import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateUser } from '$lib/auth';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { email, password } = await request.json();

	const user = await authenticateUser(email, password);

	if (!user) {
		return json({ error: '邮箱或密码错误' }, { status: 401 });
	}

	cookies.set('session_id', user.id.toString(), {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 * 7
	});

	return json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
};

export const GET: RequestHandler = async ({ locals }) => {
	if (locals.user) {
		return json({ user: locals.user });
	}
	return json({ user: null });
};

export const DELETE: RequestHandler = async ({ cookies }) => {
	cookies.delete('session_id', { path: '/' });
	throw redirect(302, '/login');
};