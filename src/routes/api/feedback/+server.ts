import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { OrderStatus, BadReviewReason, AssignmentStatus, StaffRole } from '@prisma/client';

const VALID_FEEDBACK_STATUSES = [
	OrderStatus.ASSIGNED,
	OrderStatus.NEEDS_REWORK,
	OrderStatus.IN_PROGRESS
];

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const {
			orderId,
			cleanerId,
			actualStartTime,
			actualEndTime,
			serviceNotes,
			photoEvidence = [],
			customerRating,
			customerComment = '',
			badReviewReason
		} = data;

		if (!orderId) {
			return json({
				success: false,
				error: '订单ID不能为空',
				code: 'ORDER_ID_REQUIRED'
			}, { status: 400 });
		}

		if (!cleanerId) {
			return json({
				success: false,
				error: '保洁员ID不能为空',
				code: 'CLEANER_ID_REQUIRED'
			}, { status: 400 });
		}

		const order = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
				assignments: {
					where: { status: AssignmentStatus.ACTIVE },
					include: { cleaner: true }
				},
				serviceFeedback: true
			}
		});

		if (!order) {
			return json({
				success: false,
				error: '订单不存在',
				code: 'ORDER_NOT_FOUND'
			}, { status: 404 });
		}

		if (!VALID_FEEDBACK_STATUSES.includes(order.status)) {
			return json({
				success: false,
				error: `订单状态为「${getOrderStatusLabel(order.status)}」，无法提交服务反馈`,
				code: 'INVALID_ORDER_STATUS',
				currentStatus: order.status
			}, { status: 400 });
		}

		if (order.assignments.length === 0) {
			return json({
				success: false,
				error: '该订单暂无有效派工，无法提交服务反馈',
				code: 'NO_ACTIVE_ASSIGNMENT'
			}, { status: 400 });
		}

		const activeAssignment = order.assignments[0];
		if (activeAssignment.cleanerId !== cleanerId) {
			return json({
				success: false,
				error: '当前保洁员与订单指派的保洁员不一致',
				code: 'CLEANER_MISMATCH',
				assignedCleaner: activeAssignment.cleaner
			}, { status: 400 });
		}

		const cleaner = await prisma.staff.findUnique({
			where: { id: cleanerId }
		});

		if (!cleaner) {
			return json({
				success: false,
				error: '保洁员不存在',
				code: 'CLEANER_NOT_FOUND'
			}, { status: 404 });
		}

		if (cleaner.role !== StaffRole.CLEANER) {
			return json({
				success: false,
				error: '该人员不是保洁员角色',
				code: 'INVALID_CLEANER_ROLE'
			}, { status: 400 });
		}

		if (!actualStartTime) {
			return json({
				success: false,
				error: '请填写实际开始时间',
				code: 'START_TIME_REQUIRED'
			}, { status: 400 });
		}

		if (!actualEndTime) {
			return json({
				success: false,
				error: '请填写实际结束时间',
				code: 'END_TIME_REQUIRED'
			}, { status: 400 });
		}

		const startTime = new Date(actualStartTime);
		const endTime = new Date(actualEndTime);

		if (isNaN(startTime.getTime())) {
			return json({
				success: false,
				error: '开始时间格式不正确',
				code: 'INVALID_START_TIME'
			}, { status: 400 });
		}

		if (isNaN(endTime.getTime())) {
			return json({
				success: false,
				error: '结束时间格式不正确',
				code: 'INVALID_END_TIME'
			}, { status: 400 });
		}

		if (endTime <= startTime) {
			return json({
				success: false,
				error: '结束时间必须晚于开始时间',
				code: 'END_TIME_BEFORE_START'
			}, { status: 400 });
		}

		const actualHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

		if (actualHours < 0.25) {
			return json({
				success: false,
				error: '服务时长过短（至少15分钟）',
				code: 'DURATION_TOO_SHORT'
			}, { status: 400 });
		}

		if (actualHours > 24) {
			return json({
				success: false,
				error: '服务时长不能超过24小时',
				code: 'DURATION_TOO_LONG'
			}, { status: 400 });
		}

		if (!serviceNotes || serviceNotes.trim().length === 0) {
			return json({
				success: false,
				error: '请填写服务说明',
				code: 'SERVICE_NOTES_REQUIRED'
			}, { status: 400 });
		}

		if (serviceNotes.trim().length < 10) {
			return json({
				success: false,
				error: '服务说明至少10个字',
				code: 'SERVICE_NOTES_TOO_SHORT'
			}, { status: 400 });
		}

		let finalBadReviewReason = BadReviewReason.NOT_APPLICABLE;

		if (customerRating !== undefined && customerRating !== null) {
			const rating = Number(customerRating);
			if (isNaN(rating) || rating < 1 || rating > 5) {
				return json({
					success: false,
					error: '客户评分必须在1-5分之间',
					code: 'INVALID_RATING'
				}, { status: 400 });
			}

			if (rating < 3) {
				if (!badReviewReason || badReviewReason === 'NOT_APPLICABLE') {
					return json({
						success: false,
						error: '差评请选择差评原因',
						code: 'BAD_REVIEW_REASON_REQUIRED'
					}, { status: 400 });
				}

				const validReasons = [
					BadReviewReason.ATTITUDE,
					BadReviewReason.QUALITY,
					BadReviewReason.PUNCTUALITY,
					BadReviewReason.COMMUNICATION,
					BadReviewReason.OTHER
				];

				if (!validReasons.includes(badReviewReason as BadReviewReason)) {
					return json({
						success: false,
						error: '无效的差评原因',
						code: 'INVALID_BAD_REVIEW_REASON'
					}, { status: 400 });
				}

				finalBadReviewReason = badReviewReason as BadReviewReason;
			}
		}

		const photos = Array.isArray(photoEvidence) ? photoEvidence : [];
		if (photos.length > 20) {
			return json({
				success: false,
				error: '照片数量不能超过20张',
				code: 'TOO_MANY_PHOTOS'
			}, { status: 400 });
		}

		const feedback = await prisma.$transaction(async (tx) => {
			const newFeedback = await tx.serviceFeedback.upsert({
				where: { orderId },
				update: {
					actualStartTime: startTime,
					actualEndTime: endTime,
					actualHours: actualHours,
					serviceNotes: serviceNotes.trim(),
					photoEvidence: photos,
					customerRating: customerRating ? Number(customerRating) : null,
					customerComment: customerComment?.trim() || null,
					badReviewReason: finalBadReviewReason
				},
				create: {
					orderId,
					actualStartTime: startTime,
					actualEndTime: endTime,
					actualHours: actualHours,
					serviceNotes: serviceNotes.trim(),
					photoEvidence: photos,
					customerRating: customerRating ? Number(customerRating) : null,
					customerComment: customerComment?.trim() || null,
					badReviewReason: finalBadReviewReason
				}
			});

			await tx.order.update({
				where: { id: orderId },
				data: { status: OrderStatus.COMPLETED }
			});

			return newFeedback;
		});

		return json({
			success: true,
			feedback,
			message: '服务反馈提交成功，订单已进入待质检状态',
			hoursInfo: {
				scheduled: order.scheduledHours,
				actual: actualHours,
				isInsufficient: actualHours < order.scheduledHours * 0.9,
				deficit: Math.max(0, order.scheduledHours - actualHours)
			}
		});
	} catch (error) {
		console.error('提交服务反馈失败:', error);
		return json({
			success: false,
			error: '提交服务反馈失败，请稍后重试',
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
