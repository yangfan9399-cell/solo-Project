import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { userId, assigneeId } = body;

		const record = await prisma.vehicleUsageRecord.findUnique({ where: { id } });
		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		if (record.status !== 'ARCHIVED') {
			return json({ error: 'Only archived records can be reprocessed' }, { status: 400 });
		}

		const newAssigneeId = assigneeId ?? record.applicantId;

		await prisma.processingNode.create({
			data: {
				recordId: id,
				nodeType: 'REPROCESSING',
				operatorId: userId,
				action: 'reprocess'
			}
		});

		const updated = await prisma.vehicleUsageRecord.update({
			where: { id },
			data: {
				status: 'PROCESSING',
				conclusion: null,
				currentAssigneeId: newAssigneeId
			}
		});

		return json({ record: updated });
	} catch (error) {
		return json({ error: 'Failed to reprocess record' }, { status: 500 });
	}
};
