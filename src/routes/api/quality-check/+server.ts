import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { OrderStatus, QualityResult, StaffRole, BadReviewReason } from '@prisma/client';

const VALID_CHECK_STATUSES = [
	OrderStatus.COMPLETED,
	OrderStatus.NEEDS_REWORK
];

const MIN_HOURS_RATIO = 0.9;

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { orderId, inspectorId, result, notes, compensation, needsRework, reworkReason } = data;

		if (!orderId) {
			return json({
				success: false,
				error: '订单ID不能为空',
				code: 'ORDER_ID_REQUIRED'
			}, { status: 400 });
		}

		if (!inspectorId) {
			return json({
				success: false,
				error: '质检员ID不能为空',
				code: 'INSPECTOR_REQUIRED'
			}, { status: 400 });
		}

		if (!result) {
			return json({
				success: false,
				error: '质检结果不能为空',
				code: 'RESULT_REQUIRED'
			}, { status: 400 });
		}

		if (!notes || notes.trim().length === 0) {
			return json({
				success: false,
				error: '质检说明不能为空',
				code: 'NOTES_REQUIRED'
			}, { status: 400 });
		}

		const inspector = await prisma.staff.findUnique({
			where: { id: inspectorId }
		});

		if (!inspector) {
			return json({
				success: false,
				error: '质检员不存在',
				code: 'INSPECTOR_NOT_FOUND'
			}, { status: 404 });
		}

		if (inspector.role !== StaffRole.QUALITY_INSPECTOR) {
			return json({
				success: false,
				error: '只有质检员才能进行质检操作',
				code: 'PERMISSION_DENIED'
			}, { status: 403 });
		}

		const order = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
				serviceFeedback: true,
				assignments: {
					where: { status: 'ACTIVE' },
					include: { cleaner: true }
				}
			}
		});

		if (!order) {
			return json({
				success: false,
				error: '订单不存在',
				code: 'ORDER_NOT_FOUND'
			}, { status: 404 });
		}

		if (!VALID_CHECK_STATUSES.includes(order.status)) {
			return json({
				success: false,
				error: `订单状态为「${getOrderStatusLabel(order.status)}」，无法进行质检`,
				code: 'INVALID_ORDER_STATUS',
				currentStatus: order.status
			}, { status: 400 });
		}

		if (!order.serviceFeedback) {
			return json({
				success: false,
				error: '订单暂无服务反馈，无法进行质检',
				code: 'NO_SERVICE_FEEDBACK'
			}, { status: 400 });
		}

		const scheduledHours = order.scheduledHours;
		const actualHours = order.serviceFeedback.actualHours?.toNumber() || 0;
		const hoursDeficit = Math.max(0, scheduledHours - actualHours);
		const isHoursInsufficient = actualHours < scheduledHours * MIN_HOURS_RATIO;
		const isSeverelyInsufficient = actualHours < scheduledHours * 0.7;

		if (result === QualityResult.PASSED) {
			if (isHoursInsufficient) {
				return json({
					success: false,
					error: '服务时长不足，无法直接通过质检',
					code: 'INSUFFICIENT_HOURS_BLOCKED',
					hoursInfo: {
						scheduled: scheduledHours,
						actual: actualHours,
						deficit: hoursDeficit,
						ratio: Math.round((actualHours / scheduledHours) * 100),
						severity: isSeverelyInsufficient ? 'SEVERE' : 'MILD'
					},
					availableOptions: [
						{ key: 'REWORK', label: '退回返工', description: '安排保洁员补服务至满时长' },
						{ key: 'COMPENSATION', label: '申请补偿', description: '与客户协商部分退款补偿' }
					]
				}, { status: 400 });
			}
		}

		if (result === QualityResult.COMPENSATION) {
			if (!compensation || compensation <= 0) {
				return json({
					success: false,
					error: '补偿金额不能为空且必须大于0',
					code: 'COMPENSATION_REQUIRED'
				}, { status: 400 });
			}
			if (compensation > order.estimatedPrice.toNumber()) {
				return json({
					success: false,
					error: '补偿金额不能超过订单原价',
					code: 'COMPENSATION_EXCEEDED'
				}, { status: 400 });
			}
		}

		if (result === QualityResult.REJECTED && needsRework && (!reworkReason || reworkReason.trim().length === 0)) {
			return json({
				success: false,
				error: '退回返工必须填写返工原因',
				code: 'REWORK_REASON_REQUIRED'
			}, { status: 400 });
		}

		const checkResult = await prisma.$transaction(async (tx) => {
			const qualityCheck = await tx.qualityCheck.create({
				data: {
					orderId: orderId,
					inspectorId: inspectorId,
					result: result as QualityResult,
					actualHours: actualHours,
					hoursDeficit: hoursDeficit,
					notes: notes,
					compensation: result === QualityResult.COMPENSATION ? compensation : null,
					needsRework: result === QualityResult.REJECTED ? true : (needsRework || false),
					reworkReason: result === QualityResult.REJECTED ? (reworkReason || notes) : (reworkReason || null)
				},
				include: {
					inspector: true
				}
			});

			let newStatus = order.status;

			if (result === QualityResult.PASSED && !isHoursInsufficient) {
				newStatus = OrderStatus.ARCHIVED;
			} else if (result === QualityResult.REJECTED) {
				newStatus = OrderStatus.NEEDS_REWORK;
				await tx.order.update({
					where: { id: orderId },
					data: { reworkCount: { increment: 1 } }
				});
			} else if (result === QualityResult.COMPENSATION) {
				newStatus = OrderStatus.ARCHIVED;
			}

			await tx.order.update({
				where: { id: orderId },
				data: { status: newStatus }
			});

			return {
				...qualityCheck,
				newStatus
			};
		});

		return json({
			success: true,
			checkResult,
			hoursInfo: {
				scheduled: scheduledHours,
				actual: actualHours,
				deficit: hoursDeficit,
				isInsufficient: isHoursInsufficient
			},
			message: getResultMessage(result, isHoursInsufficient)
		});
	} catch (error) {
		console.error('质检处理失败:', error);
		return json({
			success: false,
			error: '质检处理失败，请稍后重试',
			code: 'UNKNOWN_ERROR'
		}, { status: 500 });
	}
};

function getOrderStatusLabel(status: string): string {
	const labels: Record<string, string> = {
		PENDING: '待派工',
		ASSIGNED: '已派工',
		IN_PROGRESS: '进行中',
		COMPLETED: '待质检',
		CANCELLED: '已取消',
		ARCHIVED: '已归档',
		NEEDS_REWORK: '待返工'
	};
	return labels[status] || status;
}

function getResultMessage(result: string, isHoursInsufficient: boolean): string {
	switch (result) {
		case 'PASSED':
			return isHoursInsufficient ? '质检通过但时长不足，请跟进补服务' : '质检通过，订单已归档';
		case 'REJECTED':
			return '质检退回，订单已进入返工流程';
		case 'COMPENSATION':
			return '补偿处理完成，订单已归档';
		default:
			return '质检完成';
	}
}
