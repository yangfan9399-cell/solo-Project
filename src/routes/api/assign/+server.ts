import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { OrderStatus, AssignmentStatus, StaffRole } from '@prisma/client';

const VALID_ASSIGN_STATUSES = [
	OrderStatus.PENDING,
	OrderStatus.ASSIGNED,
	OrderStatus.NEEDS_REWORK
];

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { orderId, cleanerId, reassign = false, reassignedById, reassignReason, notes } = data;

		if (!orderId) {
			return json({ success: false, error: '订单ID不能为空', code: 'ORDER_ID_REQUIRED' }, { status: 400 });
		}

		if (!cleanerId) {
			return json({ success: false, error: '保洁员ID不能为空', code: 'CLEANER_REQUIRED' }, { status: 400 });
		}

		const order = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
				assignments: {
					where: { status: AssignmentStatus.ACTIVE },
					include: { cleaner: true }
				}
			}
		});

		if (!order) {
			return json({ success: false, error: '订单不存在', code: 'ORDER_NOT_FOUND' }, { status: 404 });
		}

		if (!VALID_ASSIGN_STATUSES.includes(order.status)) {
			return json({
				success: false,
				error: `订单状态为「${orderStatusLabels[order.status]}」，无法进行派工`,
				code: 'INVALID_ORDER_STATUS',
				currentStatus: order.status
			}, { status: 400 });
		}

		const cleaner = await prisma.staff.findUnique({
			where: { id: cleanerId }
		});

		if (!cleaner) {
			return json({ success: false, error: '保洁员不存在', code: 'CLEANER_NOT_FOUND' }, { status: 404 });
		}

		if (cleaner.role !== StaffRole.CLEANER) {
			return json({
				success: false,
				error: '所选人员不是保洁员',
				code: 'INVALID_CLEANER_ROLE',
				staffRole: cleaner.role
			}, { status: 400 });
		}

		const currentAssignment = order.assignments[0];

		if (currentAssignment && !reassign) {
			return json({
				success: false,
				error: '该订单已有有效派工，请使用改派功能',
				code: 'ALREADY_ASSIGNED',
				currentCleaner: currentAssignment.cleaner
			}, { status: 400 });
		}

		if (reassign && !reassignedById) {
			return json({ success: false, error: '改派人ID不能为空', code: 'REASSIGNED_BY_REQUIRED' }, { status: 400 });
		}

		if (reassign && reassignedById) {
			const reassignedBy = await prisma.staff.findUnique({
				where: { id: reassignedById }
			});

			if (!reassignedBy) {
				return json({ success: false, error: '改派人不存在', code: 'REASSIGNED_BY_NOT_FOUND' }, { status: 404 });
			}

			if (reassignedBy.role !== StaffRole.CUSTOMER_SERVICE) {
				return json({
					success: false,
					error: '只有客服经办人才能进行改派操作',
					code: 'PERMISSION_DENIED',
					staffRole: reassignedBy.role
				}, { status: 403 });
			}
		}

		if (reassign && currentAssignment && currentAssignment.cleanerId === cleanerId) {
			return json({
				success: false,
				error: '不能改派的保洁员与当前保洁员相同',
				code: 'SAME_CLEANER'
			}, { status: 400 });
		}

		const assignment = await prisma.$transaction(async (tx) => {
			if (reassign && currentAssignment) {
				await tx.assignment.update({
					where: { id: currentAssignment.id },
					data: {
						status: reassignReason === 'LEAVE' ? AssignmentStatus.CANCELLED_LEAVE : AssignmentStatus.REASSIGNED,
						reassignedAt: new Date(),
						reassignedById: reassignedById || null,
						reassignedToId: cleanerId,
						reassignedReason: reassignReason || null,
						notes: notes || null
					}
				});
			}

			const newAssignment = await tx.assignment.create({
				data: {
					orderId: orderId,
					cleanerId: cleanerId,
					status: AssignmentStatus.ACTIVE,
					notes: currentAssignment ? '改派订单' : '首次派工'
				},
				include: {
					cleaner: true,
					order: true
				}
			});

			await tx.order.update({
				where: { id: orderId },
				data: { status: OrderStatus.ASSIGNED }
			});

			return newAssignment;
		});

		return json({
			success: true,
			assignment,
			message: reassign ? '改派成功' : '派工成功'
		});
	} catch (error) {
		console.error('派工失败:', error);
		return json({ success: false, error: '派工失败，请稍后重试', code: 'UNKNOWN_ERROR' }, { status: 500 });
	}
};

const orderStatusLabels: Record<string, string> = {
	PENDING: '待派工',
	ASSIGNED: '已派工',
	IN_PROGRESS: '进行中',
	COMPLETED: '待质检',
	CANCELLED: '已取消',
	ARCHIVED: '已归档',
	NEEDS_REWORK: '待返工'
};
