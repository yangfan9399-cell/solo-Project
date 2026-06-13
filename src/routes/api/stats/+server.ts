import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

export const GET: RequestHandler = async () => {
	try {
		const [byStatus, bySampleType, violations] = await Promise.all([
			prisma.vehicleUsageRecord.groupBy({
				by: ['status'],
				_count: { id: true },
				where: {
					status: { in: ['RECEIVED', 'PROCESSING', 'REVIEW', 'ARCHIVED'] }
				}
			}),
			prisma.vehicleUsageRecord.groupBy({
				by: ['sampleType'],
				_count: { id: true }
			}),
			prisma.violationInfo.groupBy({
				by: ['isConfirmed'],
				_count: { id: true }
			})
		]);

		const statusIds = await Promise.all(
			['RECEIVED', 'PROCESSING', 'REVIEW', 'ARCHIVED'].map(async (status) => {
				const records = await prisma.vehicleUsageRecord.findMany({
					where: { status: status as 'RECEIVED' | 'PROCESSING' | 'REVIEW' | 'ARCHIVED' },
					select: { id: true }
				});
				return { status, ids: records.map((r) => r.id) };
			})
		);

		const sampleTypeIds = await Promise.all(
			['NORMAL', 'INELIGIBLE', 'TIME_CONFLICT', 'UNCONFIRMED'].map(async (sampleType) => {
				const records = await prisma.vehicleUsageRecord.findMany({
					where: { sampleType: sampleType as 'NORMAL' | 'INELIGIBLE' | 'TIME_CONFLICT' | 'UNCONFIRMED' },
					select: { id: true }
				});
				return { sampleType, ids: records.map((r) => r.id) };
			})
		);

		const confirmedViolationIds = await prisma.violationInfo.findMany({
			where: { isConfirmed: true },
			select: { recordId: true }
		});

		const unconfirmedViolationIds = await prisma.violationInfo.findMany({
			where: { isConfirmed: false },
			select: { recordId: true }
		});

		const statusMap = Object.fromEntries(
			byStatus.map((s) => [s.status, s._count.id])
		);

		const sampleTypeMap = Object.fromEntries(
			bySampleType.map((s) => [s.sampleType, s._count.id])
		);

		const violationMap = Object.fromEntries(
			violations.map((v) => [v.isConfirmed ? 'confirmed' : 'unconfirmed', v._count.id])
		);

		return json({
			byStatus: {
				RECEIVED: statusMap['RECEIVED'] ?? 0,
				PROCESSING: statusMap['PROCESSING'] ?? 0,
				REVIEW: statusMap['REVIEW'] ?? 0,
				ARCHIVED: statusMap['ARCHIVED'] ?? 0
			},
			byStatusDrilldown: Object.fromEntries(
				statusIds.map((s) => [s.status, s.ids])
			),
			bySampleType: {
				NORMAL: sampleTypeMap['NORMAL'] ?? 0,
				INELIGIBLE: sampleTypeMap['INELIGIBLE'] ?? 0,
				TIME_CONFLICT: sampleTypeMap['TIME_CONFLICT'] ?? 0,
				UNCONFIRMED: sampleTypeMap['UNCONFIRMED'] ?? 0
			},
			bySampleTypeDrilldown: Object.fromEntries(
				sampleTypeIds.map((s) => [s.sampleType, s.ids])
			),
			violations: {
				confirmed: violationMap['confirmed'] ?? 0,
				unconfirmed: violationMap['unconfirmed'] ?? 0
			},
			violationsDrilldown: {
				confirmed: [...new Set(confirmedViolationIds.map((v) => v.recordId))],
				unconfirmed: [...new Set(unconfirmedViolationIds.map((v) => v.recordId))]
			}
		});
	} catch (error) {
		return json({ error: 'Failed to fetch statistics' }, { status: 500 });
	}
};
