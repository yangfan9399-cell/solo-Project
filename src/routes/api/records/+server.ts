import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const status = url.searchParams.get('status');
		const sampleType = url.searchParams.get('sampleType');
		const search = url.searchParams.get('search');
		const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
		const limit = Math.max(1, parseInt(url.searchParams.get('limit') || '20'));
		const skip = (page - 1) * limit;

		const where: Record<string, unknown> = {};

		if (status) {
			where.status = status;
		}

		if (sampleType) {
			where.sampleType = sampleType;
		}

		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ purpose: { contains: search, mode: 'insensitive' } },
				{ department: { contains: search, mode: 'insensitive' } },
				{ applicant: { name: { contains: search, mode: 'insensitive' } } },
				{ vehicle: { plateNumber: { contains: search, mode: 'insensitive' } } }
			];
		}

		const [records, total] = await Promise.all([
			prisma.vehicleUsageRecord.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
				include: {
					applicant: true,
					vehicle: true,
					currentAssignee: true,
					violationInfos: true
				}
			}),
			prisma.vehicleUsageRecord.count({ where })
		]);

		return json({ records, total, page, limit });
	} catch (error) {
		return json({ error: 'Failed to fetch records' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const record = await prisma.vehicleUsageRecord.create({
			data: {
				title: body.title,
				applicantId: body.applicantId,
				vehicleId: body.vehicleId,
				sampleType: body.sampleType,
				appliedMileage: body.appliedMileage,
				actualMileage: body.actualMileage ?? 0,
				usageStartTime: new Date(body.usageStartTime),
				usageEndTime: new Date(body.usageEndTime),
				actualStartTime: body.actualStartTime ? new Date(body.actualStartTime) : null,
				actualEndTime: body.actualEndTime ? new Date(body.actualEndTime) : null,
				purpose: body.purpose,
				department: body.department,
				source: body.source ?? 'MANUAL',
				currentAssigneeId: body.currentAssigneeId ?? body.applicantId
			},
			include: {
				applicant: true,
				vehicle: true,
				currentAssignee: true
			}
		});

		return json(record, { status: 201 });
	} catch (error) {
		return json({ error: 'Failed to create record' }, { status: 500 });
	}
};
