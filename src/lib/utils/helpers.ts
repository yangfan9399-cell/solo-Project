import type { DraftStatus, Priority, SealShape, SealScriptType } from '$lib/types';

export function formatDate(timestamp: number): string {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatDateOnly(timestamp: number): string {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function getStatusLabel(status: DraftStatus): string {
	const labels: Record<DraftStatus, string> = {
		draft: '草稿',
		submitted: '已提交',
		reviewing: '评审中',
		approved: '已通过',
		rejected: '已驳回',
		archived: '已归档'
	};
	return labels[status];
}

export function getStatusColor(status: DraftStatus): string {
	const colors: Record<DraftStatus, string> = {
		draft: '#6b7280',
		submitted: '#3b82f6',
		reviewing: '#f59e0b',
		approved: '#10b981',
		rejected: '#ef4444',
		archived: '#9ca3af'
	};
	return colors[status];
}

export function getPriorityLabel(priority: Priority): string {
	const labels: Record<Priority, string> = {
		high: '高',
		medium: '中',
		low: '低'
	};
	return labels[priority];
}

export function getPriorityColor(priority: Priority): string {
	const colors: Record<Priority, string> = {
		high: '#ef4444',
		medium: '#f59e0b',
		low: '#10b981'
	};
	return colors[priority];
}

export function getShapeLabel(shape: SealShape): string {
	const labels: Record<SealShape, string> = {
		square: '方形',
		rectangle: '长方形',
		round: '圆形',
		oval: '椭圆形',
		irregular: '随形'
	};
	return labels[shape];
}

export function getScriptTypeLabel(type: SealScriptType): string {
	const labels: Record<SealScriptType, string> = {
		zhuwen: '朱文',
		baiwen: '白文',
		mixed: '朱白相间'
	};
	return labels[type];
}

export function getAnomalyTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		data_incomplete: '数据不完整',
		score_outlier: '分数异常',
		version_conflict: '版本冲突',
		review_overdue: '评审即将逾期',
		image_corrupted: '图片损坏'
	};
	return labels[type] || type;
}

export function getDaysRemaining(dueDate: number): number {
	const now = Date.now();
	const diff = dueDate - now;
	return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function generateExportFilename(title: string, format: string): string {
	const safeTitle = title.replace(/[^\w\u4e00-\u9fa5]/g, '_');
	const dateStr = formatDateOnly(Date.now()).replace(/-/g, '');
	return `${safeTitle}_${dateStr}.${format}`;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<boolean> {
	if (navigator.clipboard) {
		return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
	}
	return Promise.resolve(false);
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
	let timer: ReturnType<typeof setTimeout> | null = null;
	return function (this: unknown, ...args: Parameters<T>) {
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => fn.apply(this, args), delay);
	} as T;
}
