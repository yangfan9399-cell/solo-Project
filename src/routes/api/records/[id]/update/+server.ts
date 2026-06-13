import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/server/prisma';

const TRACKABLE_FIELDS = new Set([
	'usageStartTime',
	'usageEndTime',
	'actualStartTime',
	'actualEndTime',
	'currentAssigneeId',
	'appliedMileage',
	'actualMileage',
	'conclusion'
]);

const FIELD_LABELS: Record<string, string> = {
	usageStartTime: '使用开始时间',
	usageEndTime: '使用结束时间',
	actualStartTime: '实际开始时间',
	actualEndTime: '实际结束时间',
	currentAssigneeId: '当前处理人',
	appliedMileage: '申请里程',
	actualMileage: '实际里程',
	conclusion: '结论'
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { userId, fields, violationUpdate } = body;

		const record = await prisma.vehicleUsageRecord.findUnique({ where: { id } });
		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		const inputFields = fields || body;
		const changedFieldsList: { field: string; oldValue: string; newValue: string }[] = [];

		for (const [key, newValue] of Object.entries(inputFields)) {
			if (TRACKABLE_FIELDS.has(key)) {
				const oldValue = (record as Record<string, unknown>)[key];
				let oldVal = oldValue instanceof Date ? oldValue.toISOString() : String(oldValue ?? '');
				let newVal = newValue instanceof Date ? newValue.toISOString() : String(newValue ?? '');
				if (oldVal !== newVal) {
					changedFieldsList.push({
						field: FIELD_LABELS[key] || key,
						oldValue: oldVal,
						newValue: newVal
					});
				}
			}
		}

		const updateData: Record<string, unknown> = {};

		for (const key of TRACKABLE_FIELDS) {
			if (key in inputFields) {
				const val = (inputFields as Record<string, unknown>)[key];
				if (key.endsWith('Time') && val && typeof val === 'string') {
					updateData[key] = new Date(val);
				} else {
					updateData[key] = val;
				}
			}
		}

		if (changedFieldsList.length > 0) {
			const existingDiff = (record.diffFields as { field: string; oldValue: string; newValue: string }[]) ?? [];
			updateData.diffFields = [...existingDiff, ...changedFieldsList];
		}

		if (violationUpdate && violationUpdate.id) {
			await prisma.violationInfo.update({
				where: { id: violationUpdate.id },
				data: {
					isConfirmed: violationUpdate.isConfirmed ?? false
				}
			});
		}

		let updated = record;
		if (Object.keys(updateData).length > 0) {
			updated = await prisma.vehicleUsageRecord.update({
				where: { id },
				data: updateData
			});
		}

		if (changedFieldsList.length > 0) {
			await prisma.processingNode.create({
				data: {
					recordId: id,
					nodeType: 'PROCESSING',
					operatorId: userId,
					action: 'update_fields',
					changedFields: changedFieldsList
				}
			});
		}

		if (violationUpdate && violationUpdate.id) {
			await prisma.processingNode.create({
				data: {
					recordId: id,
					nodeType: 'PROCESSING',
					operatorId: userId,
					action: violationUpdate.isConfirmed ? 'confirm_violation' : 'unconfirm_violation',
					comment: `违章ID: ${violationUpdate.id}`
				}
			});
		}

		return json({ record: updated });
	} catch (error) {
		console.error('Update error:', error);
		return json({ error: 'Failed to update record' }, { status: 500 });
	}
};
