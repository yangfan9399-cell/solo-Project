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

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { id } = params;
		const body = await request.json();
		const { userId, fields } = body;

		if (!fields || typeof fields !== 'object') {
			return json({ error: 'fields object is required' }, { status: 400 });
		}

		const record = await prisma.vehicleUsageRecord.findUnique({ where: { id } });
		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		const changedFields: Record<string, { old: unknown; new: unknown }> = {};

		for (const [key, newValue] of Object.entries(fields)) {
			if (TRACKABLE_FIELDS.has(key)) {
				const oldValue = (record as Record<string, unknown>)[key];
				if (oldValue !== newValue) {
					changedFields[key] = {
						old: oldValue instanceof Date ? oldValue.toISOString() : oldValue,
						new: newValue
					};
				}
			}
		}

		const updateData: Record<string, unknown> = { ...fields };

		if (fields.usageStartTime) updateData.usageStartTime = new Date(fields.usageStartTime);
		if (fields.usageEndTime) updateData.usageEndTime = new Date(fields.usageEndTime);
		if (fields.actualStartTime) updateData.actualStartTime = new Date(fields.actualStartTime);
		if (fields.actualEndTime) updateData.actualEndTime = new Date(fields.actualEndTime);

		if (Object.keys(changedFields).length > 0) {
			const existingDiff = (record.diffFields as Record<string, unknown>[]) ?? [];
			updateData.diffFields = [
				...existingDiff,
				{
					timestamp: new Date().toISOString(),
					changedBy: userId,
					changes: changedFields
				}
			];
		}

		const updated = await prisma.vehicleUsageRecord.update({
			where: { id },
			data: updateData
		});

		if (Object.keys(changedFields).length > 0) {
			await prisma.processingNode.create({
				data: {
					recordId: id,
					nodeType: 'PROCESSING',
					operatorId: userId,
					action: 'update_fields',
					changedFields: changedFields
				}
			});
		}

		return json({ record: updated });
	} catch (error) {
		return json({ error: 'Failed to update record' }, { status: 500 });
	}
};
