import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { action, userId, comment, conclusion, basis } = body;

		const record = await prisma.vehicleUsageRecord.findUnique({
			where: { id },
			include: { applicant: true }
		});
		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		switch (action) {
			case 'confirm': {
				const updated = await prisma.vehicleUsageRecord.update({
					where: { id },
					data: {
						conclusion: conclusion ?? record.conclusion,
						basis: basis ?? record.basis
					}
				});

				await prisma.processingNode.create({
					data: {
						recordId: id,
						nodeType: 'REVIEW_CONFIRMED',
						operatorId: userId,
						action: 'confirm',
						comment: comment ?? null
					}
				});

				return json({ record: updated });
			}

			case 'return': {
				const updated = await prisma.vehicleUsageRecord.update({
					where: { id },
					data: {
						status: 'PROCESSING',
						currentAssigneeId: record.applicantId
					}
				});

				await prisma.processingNode.create({
					data: {
						recordId: id,
						nodeType: 'REVIEW_RETURNED',
						operatorId: userId,
						action: 'return',
						comment: comment ?? null
					}
				});

				return json({ record: updated });
			}

			case 'archive': {
				const updated = await prisma.vehicleUsageRecord.update({
					where: { id },
					data: {
						status: 'ARCHIVED'
					}
				});

				await prisma.processingNode.create({
					data: {
						recordId: id,
						nodeType: 'ARCHIVED',
						operatorId: userId,
						action: 'archive'
					}
				});

				return json({ record: updated });
			}

			default:
				return json({ error: `Unknown action: ${action}` }, { status: 400 });
		}
	} catch (error) {
		return json({ error: 'Failed to process review action' }, { status: 500 });
	}
};
