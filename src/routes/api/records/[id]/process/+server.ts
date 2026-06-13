import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { action, userId, ...data } = body;

		const record = await prisma.vehicleUsageRecord.findUnique({ where: { id } });
		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		switch (action) {
			case 'add_business_record': {
				const businessRecord = await prisma.businessRecord.create({
					data: {
						recordId: id,
						content: data.content,
						recordType: data.recordType,
						createdById: userId
					}
				});

				await prisma.processingNode.create({
					data: {
						recordId: id,
						nodeType: 'PROCESSING',
						operatorId: userId,
						action: 'add_business_record',
						snapshot: businessRecord
					}
				});

				return json({ businessRecord }, { status: 201 });
			}

			case 'add_explanation': {
				const explanation = await prisma.onSiteExplanation.create({
					data: {
						recordId: id,
						content: data.content,
						createdById: userId
					}
				});

				await prisma.processingNode.create({
					data: {
						recordId: id,
						nodeType: 'PROCESSING',
						operatorId: userId,
						action: 'add_explanation',
						snapshot: explanation
					}
				});

				return json({ explanation }, { status: 201 });
			}

			case 'add_evidence': {
				const evidence = await prisma.evidenceAttachment.create({
					data: {
						recordId: id,
						fileName: data.fileName,
						fileType: data.fileType,
						fileSize: data.fileSize,
						filePath: data.filePath,
						description: data.description,
						uploadedById: userId
					}
				});

				await prisma.processingNode.create({
					data: {
						recordId: id,
						nodeType: 'PROCESSING',
						operatorId: userId,
						action: 'add_evidence',
						snapshot: evidence
					}
				});

				return json({ evidence }, { status: 201 });
			}

			case 'submit_for_review': {
				const reviewer = await prisma.user.findFirst({
					where: { role: 'QC_REVIEWER' }
				});

				if (!reviewer) {
					return json({ error: 'No QC reviewer available' }, { status: 400 });
				}

				const updated = await prisma.vehicleUsageRecord.update({
					where: { id },
					data: {
						status: 'REVIEW',
						currentAssigneeId: reviewer.id
					}
				});

				await prisma.processingNode.create({
					data: {
						recordId: id,
						nodeType: 'REVIEW_SUBMITTED',
						operatorId: userId,
						action: 'submit_for_review'
					}
				});

				return json({ record: updated });
			}

			default:
				return json({ error: `Unknown action: ${action}` }, { status: 400 });
		}
	} catch (error) {
		return json({ error: 'Failed to process action' }, { status: 500 });
	}
};
