import bcrypt from 'bcryptjs';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export async function authenticateUser(email: string, password: string) {
	const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

	if (user.length === 0) {
		return null;
	}

	const isValid = await bcrypt.compare(password, user[0].passwordHash);

	if (!isValid) {
		return null;
	}

	return user[0];
}

export function getRoleDisplayName(role: string) {
	const roleNames: Record<string, string> = {
		consultant: '招生顾问',
		admin: '教务管理员',
		supervisor: '部门主管'
	};
	return roleNames[role] || role;
}

export function getStatusDisplayName(status: string) {
	const statusNames: Record<string, string> = {
		pending_booking: '待预约',
		pending_schedule: '待排课',
		scheduled: '已排课',
		teacher_conflict: '老师冲突',
		completed: '已完成',
		no_show: '学生爽约',
		cancelled: '已取消',
		rescheduled: '已改期'
	};
	return statusNames[status] || status;
}

export function getConversionStatusDisplayName(status: string) {
	const statusNames: Record<string, string> = {
		pending_review: '待复核',
		converted: '转化成功',
		not_converted: '未转化',
		returned: '已退回'
	};
	return statusNames[status] || status;
}

export function getSourceChannelDisplayName(channel: string) {
	const channelNames: Record<string, string> = {
		wechat: '微信',
		douyin: '抖音',
		baidu: '百度',
		tuiguang: '推广',
		referral: '转介绍',
		walk_in: '门店到访',
		other: '其他'
	};
	return channelNames[channel] || channel;
}