import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { followUps } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, '未登录');
	}

	const followUpId = parseInt(params.id);
	const data = await request.json();

	const [existing] = await db.select().from(followUps).where(eq(followUps.id, followUpId));

	if (!existing) {
		throw error(404, '回访记录不存在');
	}

	if (locals.user.role === 'consultant' && existing.consultantId !== locals.user.id) {
		throw error(403, '只能编辑自己的回访记录');
	}

	if (locals.user.role === 'consultant' && data.conversionStatus) {
		delete data.conversionStatus;
	}

	const updateData: any = {};

	if (data.content !== undefined) updateData.content = data.content;
	if (data.studentFeedback !== undefined) updateData.studentFeedback = data.studentFeedback;
	if (data.interestLevel !== undefined) updateData.interestLevel = data.interestLevel;
	if (data.conversionSuggestion !== undefined)
		updateData.conversionSuggestion = data.conversionSuggestion;

	if (locals.user.role === 'supervisor') {
		if (data.conversionStatus !== undefined) updateData.conversionStatus = data.conversionStatus;
		if (data.supervisorNote !== undefined) updateData.supervisorNote = data.supervisorNote;
		if (data.conversionStatus) {
			updateData.supervisorId = locals.user.id;
			updateData.reviewedAt = new Date();
		}
	}

	const [updated] = await db
		.update(followUps)
		.set(updateData)
		.where(eq(followUps.id, followUpId))
		.returning();

	return json(updated);
};