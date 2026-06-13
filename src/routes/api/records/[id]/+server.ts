import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const record = await prisma.vehicleUsageRecord.findUnique({
			where: { id: params.id },
			include: {
				applicant: true,
				vehicle: true,
				currentAssignee: true,
				processingNodes: {
					include: { operator: true },
					orderBy: { createdAt: 'asc' }
				},
				businessRecords: {
					include: { createdBy: true },
					orderBy: { createdAt: 'asc' }
				},
				onSiteExplanations: {
					include: { createdBy: true },
					orderBy: { createdAt: 'asc' }
				},
				evidenceAttachments: {
					include: { uploadedBy: true },
					orderBy: { createdAt: 'asc' }
				},
				violationInfos: true
			}
		});

		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		return json(record);
	} catch (error) {
		return json({ error: 'Failed to fetch record' }, { status: 500 });
	}
};
