export type UserRole = 'manager' | 'cleaner' | 'reception';

export interface User {
	id: number;
	username: string;
	name: string;
	role: UserRole;
	created_at: string;
	updated_at: string;
}

export interface Hall {
	id: number;
	name: string;
	capacity: number;
	is_active: boolean;
	created_at: string;
}

export interface Showtime {
	id: number;
	hall_id: number;
	movie_name: string;
	start_time: string;
	end_time: string;
	created_at: string;
	hall?: Hall;
}

export type LockerStatus = 'available' | 'occupied' | 'maintenance';
export type LockerCapacity = 'small' | 'medium' | 'large';

export interface Locker {
	id: number;
	code: string;
	area: string;
	capacity: LockerCapacity;
	status: LockerStatus;
	created_at: string;
	item?: Item;
}

export type ItemStatus = 'found' | 'storing' | 'claimed' | 'returned' | 'disposed' | 'exception';
export type ItemCategory =
	| 'electronics'
	| 'clothing'
	| 'accessories'
	| 'documents'
	| 'bags'
	| 'glasses'
	| 'keys'
	| 'water_bottle'
	| 'umbrella'
	| 'other';

export interface Item {
	id: number;
	item_code: string;
	name: string;
	description: string | null;
	category: ItemCategory;
	color: string | null;
	distinguishing_features: string | null;
	images: string | null;
	status: ItemStatus;
	hall_id: number | null;
	showtime_id: number | null;
	found_location: string | null;
	found_time: string;
	finder_id: number;
	locker_id: number | null;
	stored_at: string | null;
	stored_by: number | null;
	disposal_due_date: string | null;
	disposed_at: string | null;
	disposed_by: number | null;
	disposal_reason: string | null;
	exception_note: string | null;
	created_at: string;
	updated_at: string;
	hall?: Hall;
	showtime?: Showtime;
	finder?: User;
	locker?: Locker;
	stored_by_user?: User;
	claims?: Claim[];
}

export type IdType = 'id_card' | 'passport' | 'driver_license';

export interface Claimant {
	id: number;
	name: string;
	phone: string;
	id_type: IdType | null;
	id_number: string | null;
	created_at: string;
}

export type ClaimStatus =
	| 'pending'
	| 'verifying'
	| 'approved'
	| 'rejected'
	| 'completed'
	| 'cancelled';

export interface Claim {
	id: number;
	item_id: number;
	claimant_id: number;
	status: ClaimStatus;
	claim_time: string;
	verification_time: string | null;
	verified_by: number | null;
	verification_notes: string | null;
	return_time: string | null;
	returned_by: number | null;
	signature_image: string | null;
	rejection_reason: string | null;
	created_at: string;
	updated_at: string;
	item?: Item;
	claimant?: Claimant;
	verified_by_user?: User;
	returned_by_user?: User;
}

export interface ActivityLog {
	id: number;
	item_id: number | null;
	claim_id: number | null;
	user_id: number | null;
	action: string;
	details: string | null;
	created_at: string;
	user?: User;
}

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
}

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
	electronics: '电子产品',
	clothing: '衣物',
	accessories: '配饰',
	documents: '证件文件',
	bags: '箱包',
	glasses: '眼镜',
	keys: '钥匙',
	water_bottle: '水杯',
	umbrella: '雨伞',
	other: '其他'
};

export const STATUS_LABELS: Record<ItemStatus, string> = {
	found: '已拾获',
	storing: '保管中',
	claimed: '待领取',
	returned: '已归还',
	disposed: '已处置',
	exception: '异常'
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
	pending: '待审核',
	verifying: '核验中',
	approved: '已通过',
	rejected: '已拒绝',
	completed: '已完成',
	cancelled: '已取消'
};

export const ROLE_LABELS: Record<UserRole, string> = {
	manager: '值班经理',
	cleaner: '保洁员',
	reception: '客服前台'
};

export interface ItemWithJoined extends Item {
	hall_name?: string;
	showtime_movie_name?: string;
	showtime_start?: string;
	finder_name?: string;
	locker_code?: string;
	locker_area?: string;
	stored_by_name?: string;
}

export interface ClaimWithJoined extends Claim {
	item_name?: string;
	item_code?: string;
	claimant_name?: string;
	claimant_phone?: string;
	verified_by_name?: string;
	returned_by_name?: string;
}

export interface ActivityLogWithJoined extends ActivityLog {
	user_name?: string;
}

export interface LockerWithItem extends Locker {
	item?: Item;
}

export interface PageFormData {
	error?: string;
}
