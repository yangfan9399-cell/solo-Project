import { db } from './index';
import { users, teachers, courses, students, appointments, followUps, appointmentChanges } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
	console.log('Seeding database...');

	const hashedPassword = await bcrypt.hash('password123', 10);

	await db.insert(users).values([
		{ id: 1, name: '张顾问', email: 'consultant@example.com', passwordHash: hashedPassword, role: 'consultant' },
		{ id: 2, name: '李教务', email: 'admin@example.com', passwordHash: hashedPassword, role: 'admin' },
		{ id: 3, name: '王主管', email: 'supervisor@example.com', passwordHash: hashedPassword, role: 'supervisor' }
	]);

	await db.insert(teachers).values([
		{ id: 1, name: '陈老师', phone: '13800138001', specialties: ['数学', '物理'] },
		{ id: 2, name: '刘老师', phone: '13800138002', specialties: ['英语', '语文'] },
		{ id: 3, name: '赵老师', phone: '13800138003', specialties: ['化学', '生物'] },
		{ id: 4, name: '孙老师', phone: '13800138004', specialties: ['数学', '英语'] }
	]);

	await db.insert(courses).values([
		{ id: 1, name: '高中数学试听课', duration: 60, description: '高中数学重点难点解析', price: 0 },
		{ id: 2, name: '初中英语试听课', duration: 45, description: '初中英语入门与提高', price: 0 },
		{ id: 3, name: '高考物理冲刺试听', duration: 90, description: '高考物理核心考点', price: 0 },
		{ id: 4, name: '化学兴趣班试听', duration: 60, description: '趣味化学实验体验', price: 0 }
	]);

	const now = new Date();

	await db.insert(students).values([
		{ id: 1, name: '小明', phone: '13900139001', age: 16, parentName: '明爸爸', sourceChannel: 'wechat', sourceNote: '微信公众号咨询', consultantId: 1 },
		{ id: 2, name: '小红', phone: '13900139002', age: 14, parentName: '红妈妈', sourceChannel: 'douyin', sourceNote: '抖音短视频引流', consultantId: 1 },
		{ id: 3, name: '小刚', phone: '13900139003', age: 17, parentName: '刚爸爸', sourceChannel: 'baidu', sourceNote: '百度搜索广告', consultantId: 1 },
		{ id: 4, name: '小丽', phone: '13900139004', age: 15, parentName: '丽妈妈', sourceChannel: 'referral', sourceNote: '老学员推荐', consultantId: 1 },
		{ id: 5, name: '小华', phone: '13900139005', age: 16, parentName: '华爸爸', sourceChannel: 'walk_in', sourceNote: '门店直接到访', consultantId: 1 }
	]);

	await db.insert(appointments).values([
		{
			id: 1,
			studentId: 1,
			courseId: 1,
			teacherId: 1,
			consultantId: 1,
			scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
			duration: 60,
			status: 'completed',
			notes: '正常到课试听'
		},
		{
			id: 2,
			studentId: 2,
			courseId: 2,
			teacherId: 2,
			consultantId: 1,
			scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
			duration: 45,
			status: 'no_show',
			notes: '学生未到课，电话联系不上'
		},
		{
			id: 3,
			studentId: 3,
			courseId: 3,
			teacherId: 1,
			consultantId: 1,
			scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
			duration: 90,
			status: 'teacher_conflict',
			notes: '陈老师同一时间段有其他课程安排'
		},
		{
			id: 4,
			studentId: 4,
			courseId: 1,
			teacherId: 1,
			consultantId: 1,
			scheduledAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
			duration: 60,
			status: 'completed',
			notes: ''
		},
		{
			id: 5,
			studentId: 5,
			courseId: 4,
			teacherId: 3,
			consultantId: 1,
			scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
			duration: 60,
			status: 'scheduled',
			notes: '待上课'
		},
		{
			id: 6,
			studentId: 3,
			courseId: 3,
			teacherId: 4,
			consultantId: 1,
			previousAppointmentId: 3,
			scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
			duration: 90,
			status: 'scheduled',
			notes: '改期换老师后重新预约'
		}
	]);

	await db.insert(followUps).values([
		{
			id: 1,
			appointmentId: 1,
			consultantId: 1,
			content: '试听后跟进，学生对课程内容很感兴趣',
			studentFeedback: '老师讲得很好，容易理解',
			interestLevel: 5,
			conversionSuggestion: '建议推荐长期班课程',
			conversionStatus: 'converted',
			supervisorNote: '转化成功，已报名一年期课程',
			supervisorId: 3,
			reviewedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
		},
		{
			id: 2,
			appointmentId: 2,
			consultantId: 1,
			content: '爽约后电话回访，家长表示忘记时间了',
			studentFeedback: '',
			interestLevel: 3,
			conversionSuggestion: '建议重新安排试听时间',
			conversionStatus: 'pending_review'
		},
		{
			id: 3,
			appointmentId: 3,
			consultantId: 1,
			content: '老师时间冲突，已联系家长说明情况',
			studentFeedback: '家长表示理解，愿意改期',
			interestLevel: 4,
			conversionSuggestion: '已推荐其他老师，待确认新时间',
			conversionStatus: 'returned',
			supervisorNote: '请尽快安排新的试听时间',
			supervisorId: 3,
			reviewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
		},
		{
			id: 4,
			appointmentId: 4,
			consultantId: 1,
			content: '',
			studentFeedback: '',
			interestLevel: null,
			conversionSuggestion: '',
			conversionStatus: 'pending_review'
		}
	]);

	await db.insert(appointmentChanges).values([
		{
			appointmentId: 3,
			changedBy: 2,
			changeType: 'status_change',
			oldValue: 'pending_schedule',
			newValue: 'teacher_conflict',
			reason: '检测到陈老师时间冲突'
		},
		{
			appointmentId: 6,
			changedBy: 1,
			changeType: 'reschedule',
			oldValue: JSON.stringify({ teacherId: 1, scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) }),
			newValue: JSON.stringify({ teacherId: 4, scheduledAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000) }),
			reason: '原老师时间冲突，更换老师和时间'
		}
	]);

	console.log('Seeding completed!');
	process.exit(0);
}

seed().catch((err) => {
	console.error('Seeding failed:', err);
	process.exit(1);
});