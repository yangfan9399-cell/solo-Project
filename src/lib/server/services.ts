import { db } from './db';
import type {
	Item,
	ItemCategory,
	ItemStatus,
	Showtime,
	Locker,
	Claim,
	Claimant,
	ClaimStatus,
	PaginatedResult,
	ActivityLog,
	User,
	Hall,
	ItemWithJoined,
	ClaimWithJoined,
	ActivityLogWithJoined,
	IdType
} from '$lib/types';

interface ItemRow extends Item {
	hall_name?: string;
	movie_name?: string;
	showtime_start?: string;
	finder_name?: string;
	locker_code?: string;
	locker_area?: string;
	stored_by_name?: string;
}

interface ClaimRow extends Claim {
	item_name?: string;
	item_code?: string;
	claimant_name?: string;
	claimant_phone?: string;
	verified_by_name?: string;
	returned_by_name?: string;
}

interface ActivityLogRow extends ActivityLog {
	user_name?: string;
}

interface ShowtimeRow extends Showtime {
	hall_name?: string;
}

export function generateItemCode(): string {
	const date = new Date();
	const prefix = `LF${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
	const count = db
		.prepare('SELECT COUNT(*) as count FROM items WHERE item_code LIKE ?')
		.get(`${prefix}%`) as { count: number };
	return `${prefix}${String(count.count + 1).padStart(4, '0')}`;
}

export function logActivity(
	itemId: number | null,
	claimId: number | null,
	userId: number | null,
	action: string,
	details?: string
): void {
	db.prepare(
		'INSERT INTO activity_logs (item_id, claim_id, user_id, action, details) VALUES (?, ?, ?, ?, ?)'
	).run(itemId, claimId, userId, action, details || null);
}

export function getUsers(): User[] {
	return db.prepare('SELECT id, username, name, role, created_at FROM users').all() as User[];
}

export function getUserById(id: number): User | undefined {
	return db.prepare('SELECT id, username, name, role, created_at FROM users WHERE id = ?').get(id) as
		| User
		| undefined;
}

export function getHalls(): Hall[] {
	return db.prepare('SELECT * FROM halls WHERE is_active = 1 ORDER BY name').all() as Hall[];
}

export function getShowtimes(date?: string): Showtime[] {
	let query = `
		SELECT s.*, h.name as hall_name 
		FROM showtimes s 
		JOIN halls h ON s.hall_id = h.id 
	`;
	const params: string[] = [];

	if (date) {
		query += 'WHERE DATE(s.start_time) = ? ';
		params.push(date);
	}

	query += 'ORDER BY s.start_time DESC';
	return db.prepare(query).all(...params) as ShowtimeRow[];
}

export function createShowtime(
	hallId: number,
	movieName: string,
	startTime: string,
	endTime: string
): number {
	const result = db
		.prepare(
			'INSERT INTO showtimes (hall_id, movie_name, start_time, end_time) VALUES (?, ?, ?, ?)'
		)
		.run(hallId, movieName, startTime, endTime);
	return Number(result.lastInsertRowid);
}

export function getLockers(area?: string): Locker[] {
	let query = 'SELECT * FROM lockers';
	const params: string[] = [];

	if (area) {
		query += ' WHERE area = ?';
		params.push(area);
	}

	query += ' ORDER BY code';
	return db.prepare(query).all(...params) as Locker[];
}

export function getLockerById(id: number): Locker | undefined {
	return db.prepare('SELECT * FROM lockers WHERE id = ?').get(id) as Locker | undefined;
}

export function updateLockerStatus(id: number, status: Locker['status']): void {
	db.prepare('UPDATE lockers SET status = ? WHERE id = ?').run(status, id);
}

export function createItem(data: {
	name: string;
	description?: string;
	category: ItemCategory;
	color?: string;
	distinguishing_features?: string;
	hall_id?: number;
	showtime_id?: number;
	found_location?: string;
	found_time: string;
	finder_id: number;
}): Item {
	const itemCode = generateItemCode();
	const disposalDueDate = new Date(data.found_time);
	disposalDueDate.setDate(disposalDueDate.getDate() + 30);

	const result = db
		.prepare(
			`INSERT INTO items (
				item_code, name, description, category, color, distinguishing_features,
				hall_id, showtime_id, found_location, found_time, finder_id, disposal_due_date
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			itemCode,
			data.name,
			data.description || null,
			data.category,
			data.color || null,
			data.distinguishing_features || null,
			data.hall_id || null,
			data.showtime_id || null,
			data.found_location || null,
			data.found_time,
			data.finder_id,
			disposalDueDate.toISOString()
		);

	const itemId = Number(result.lastInsertRowid);
	logActivity(itemId, null, data.finder_id, 'item_registered', `物品登记: ${data.name}`);

	return getItemById(itemId) as Item;
}

export function getItemById(id: number): ItemWithJoined | undefined {
	const item = db
		.prepare(
			`
		SELECT i.*, 
		       h.name as hall_name,
		       s.movie_name, s.start_time as showtime_start,
		       u_f.name as finder_name,
		       l.code as locker_code, l.area as locker_area,
		       u_s.name as stored_by_name
		FROM items i
		LEFT JOIN halls h ON i.hall_id = h.id
		LEFT JOIN showtimes s ON i.showtime_id = s.id
		LEFT JOIN users u_f ON i.finder_id = u_f.id
		LEFT JOIN lockers l ON i.locker_id = l.id
		LEFT JOIN users u_s ON i.stored_by = u_s.id
		WHERE i.id = ?
	`
		)
		.get(id) as ItemRow | undefined;

	if (item) {
		const itemWithJoined = item as ItemWithJoined;
		itemWithJoined.hall = item.hall_id ? { id: item.hall_id, name: item.hall_name || '' } : undefined;
		itemWithJoined.showtime = item.showtime_id
			? {
					id: item.showtime_id,
					hall_id: item.hall_id || 0,
					movie_name: item.movie_name || '',
					start_time: item.showtime_start || '',
					end_time: '',
					created_at: ''
				}
			: undefined;
		itemWithJoined.finder = { id: item.finder_id, name: item.finder_name || '' } as User;
		itemWithJoined.locker = item.locker_id
			? { id: item.locker_id, code: item.locker_code || '', area: item.locker_area || '', capacity: 'medium', status: 'occupied', created_at: '' }
			: undefined;
		itemWithJoined.stored_by_user = item.stored_by
			? { id: item.stored_by, name: item.stored_by_name || '' } as User
			: undefined;
		return itemWithJoined;
	}

	return undefined;
}

export function getItems(params: {
	status?: ItemStatus;
	category?: ItemCategory;
	hall_id?: number;
	search?: string;
	page?: number;
	pageSize?: number;
}): PaginatedResult<ItemWithJoined> {
	const page = params.page || 1;
	const pageSize = params.pageSize || 20;
	const offset = (page - 1) * pageSize;

	let whereClause = 'WHERE 1=1';
	const queryParams: (string | number)[] = [];

	if (params.status) {
		whereClause += ' AND i.status = ?';
		queryParams.push(params.status);
	}

	if (params.category) {
		whereClause += ' AND i.category = ?';
		queryParams.push(params.category);
	}

	if (params.hall_id) {
		whereClause += ' AND i.hall_id = ?';
		queryParams.push(params.hall_id);
	}

	if (params.search) {
		whereClause += ' AND (i.name LIKE ? OR i.item_code LIKE ? OR i.description LIKE ?)';
		const searchTerm = `%${params.search}%`;
		queryParams.push(searchTerm, searchTerm, searchTerm);
	}

	const countResult = db
		.prepare(`SELECT COUNT(*) as count FROM items i ${whereClause}`)
		.get(...queryParams) as { count: number };

	const items = db
		.prepare(
			`
		SELECT i.*, 
		       h.name as hall_name,
		       u_f.name as finder_name,
		       l.code as locker_code
		FROM items i
		LEFT JOIN halls h ON i.hall_id = h.id
		LEFT JOIN users u_f ON i.finder_id = u_f.id
		LEFT JOIN lockers l ON i.locker_id = l.id
		${whereClause}
		ORDER BY i.found_time DESC
		LIMIT ? OFFSET ?
	`
		)
		.all(...queryParams, pageSize, offset) as ItemWithJoined[];

	return {
		data: items,
		total: countResult.count,
		page,
		pageSize
	};
}

export function storeItem(itemId: number, lockerId: number, storedBy: number): void {
	db.exec(`
		UPDATE items 
		SET status = 'storing', locker_id = ${lockerId}, stored_at = CURRENT_TIMESTAMP, stored_by = ${storedBy}, updated_at = CURRENT_TIMESTAMP
		WHERE id = ${itemId};
		
		UPDATE lockers SET status = 'occupied' WHERE id = ${lockerId};
	`);
	logActivity(itemId, null, storedBy, 'item_stored', '存入保管柜');
}

export function updateItemStatus(itemId: number, status: ItemStatus, userId: number, note?: string): void {
	db.prepare('UPDATE items SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
		status,
		itemId
	);

	if (status === 'exception' && note) {
		db.prepare('UPDATE items SET exception_note = ? WHERE id = ?').run(note, itemId);
	}

	logActivity(itemId, null, userId, `status_updated`, `状态变更为: ${status}`);
}

export function findOrCreateClaimant(data: {
	name: string;
	phone: string;
	id_type?: IdType;
	id_number?: string;
}): Claimant {
	let claimant = db
		.prepare('SELECT * FROM claimants WHERE phone = ?')
		.get(data.phone) as Claimant | undefined;

	if (!claimant) {
		const result = db
			.prepare(
				'INSERT INTO claimants (name, phone, id_type, id_number) VALUES (?, ?, ?, ?)'
			)
			.run(
				data.name,
				data.phone,
				data.id_type || null,
				data.id_number || null
			);
		claimant = {
			id: Number(result.lastInsertRowid),
			name: data.name,
			phone: data.phone,
			id_type: data.id_type || null,
			id_number: data.id_number || null,
			created_at: new Date().toISOString()
		};
	}

	return claimant;
}

export function createClaim(data: {
	item_id: number;
	claimant_name: string;
	claimant_phone: string;
	claimant_id_type?: IdType;
	claimant_id_number?: string;
}): ClaimWithJoined {
	const claimant = findOrCreateClaimant({
		name: data.claimant_name,
		phone: data.claimant_phone,
		id_type: data.claimant_id_type,
		id_number: data.claimant_id_number
	});

	const result = db
		.prepare(
			'INSERT INTO claims (item_id, claimant_id, status) VALUES (?, ?, ?)'
		)
		.run(data.item_id, claimant.id, 'pending');

	const claimId = Number(result.lastInsertRowid);
	db.prepare("UPDATE items SET status = 'claimed' WHERE id = ?").run(data.item_id);
	logActivity(data.item_id, claimId, null, 'claim_created', `失主: ${claimant.name}`);

	return getClaimById(claimId) as ClaimWithJoined;
}

export function getClaimById(id: number): ClaimWithJoined | undefined {
	return db
		.prepare(
			`
		SELECT c.*,
		       i.name as item_name, i.item_code,
		       cl.name as claimant_name, cl.phone as claimant_phone,
		       u_v.name as verified_by_name,
		       u_r.name as returned_by_name
		FROM claims c
		JOIN items i ON c.item_id = i.id
		JOIN claimants cl ON c.claimant_id = cl.id
		LEFT JOIN users u_v ON c.verified_by = u_v.id
		LEFT JOIN users u_r ON c.returned_by = u_r.id
		WHERE c.id = ?
	`
		)
		.get(id) as ClaimWithJoined | undefined;
}

export function getClaims(params: {
	status?: ClaimStatus;
	item_id?: number;
	page?: number;
	pageSize?: number;
}): PaginatedResult<ClaimWithJoined> {
	const page = params.page || 1;
	const pageSize = params.pageSize || 20;
	const offset = (page - 1) * pageSize;

	let whereClause = 'WHERE 1=1';
	const queryParams: (string | number)[] = [];

	if (params.status) {
		whereClause += ' AND c.status = ?';
		queryParams.push(params.status);
	}

	if (params.item_id) {
		whereClause += ' AND c.item_id = ?';
		queryParams.push(params.item_id);
	}

	const countResult = db
		.prepare(`SELECT COUNT(*) as count FROM claims c ${whereClause}`)
		.get(...queryParams) as { count: number };

	const claims = db
		.prepare(
			`
		SELECT c.*,
		       i.name as item_name, i.item_code,
		       cl.name as claimant_name, cl.phone as claimant_phone
		FROM claims c
		JOIN items i ON c.item_id = i.id
		JOIN claimants cl ON c.claimant_id = cl.id
		${whereClause}
		ORDER BY c.claim_time DESC
		LIMIT ? OFFSET ?
	`
		)
		.all(...queryParams, pageSize, offset) as ClaimWithJoined[];

	return {
		data: claims,
		total: countResult.count,
		page,
		pageSize
	};
}

export function verifyClaim(
	claimId: number,
	verifiedBy: number,
	status: 'approved' | 'rejected',
	notes?: string,
	rejectionReason?: string
): void {
	const notesValue = notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL';
	const rejectionValue = rejectionReason ? `'${rejectionReason.replace(/'/g, "''")}'` : 'NULL';

	db.exec(`
		UPDATE claims 
		SET status = '${status}', 
		    verification_time = CURRENT_TIMESTAMP, 
		    verified_by = ${verifiedBy},
		    verification_notes = ${notesValue},
		    rejection_reason = ${rejectionValue},
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = ${claimId};
	`);

	if (status === 'rejected') {
		const claim = getClaimById(claimId);
		if (claim) {
			db.prepare("UPDATE items SET status = 'storing' WHERE id = ?").run(claim.item_id);
		}
	}

	logActivity(null, claimId, verifiedBy, `claim_${status}`, notes || '');
}

export function completeClaim(claimId: number, returnedBy: number, signature?: string): void {
	const claim = getClaimById(claimId);
	if (!claim) return;

	const signatureValue = signature ? `'${signature.replace(/'/g, "''")}'` : 'NULL';

	db.exec(`
		UPDATE claims 
		SET status = 'completed', 
		    return_time = CURRENT_TIMESTAMP, 
		    returned_by = ${returnedBy},
		    signature_image = ${signatureValue},
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = ${claimId};
		
		UPDATE items 
		SET status = 'returned', updated_at = CURRENT_TIMESTAMP 
		WHERE id = ${claim.item_id};
		
		UPDATE lockers 
		SET status = 'available' 
		WHERE id = (SELECT locker_id FROM items WHERE id = ${claim.item_id});
	`);

	logActivity(claim.item_id, claimId, returnedBy, 'item_returned', '物品已归还');
}

export function disposeItem(itemId: number, disposedBy: number, reason: string): void {
	const item = getItemById(itemId);
	if (!item) return;

	if (item.locker_id) {
		db.prepare("UPDATE lockers SET status = 'available' WHERE id = ?").run(item.locker_id);
	}

	db.prepare(
		`UPDATE items 
		 SET status = 'disposed', 
		     disposed_at = CURRENT_TIMESTAMP, 
		     disposed_by = ?, 
		     disposal_reason = ?,
		     updated_at = CURRENT_TIMESTAMP 
		 WHERE id = ?`
	).run(disposedBy, reason, itemId);

	logActivity(itemId, null, disposedBy, 'item_disposed', reason);
}

export function getOverdueItems(): ItemWithJoined[] {
	return db
		.prepare(
			`
		SELECT i.*, h.name as hall_name, l.code as locker_code
		FROM items i
		LEFT JOIN halls h ON i.hall_id = h.id
		LEFT JOIN lockers l ON i.locker_id = l.id
		WHERE i.status IN ('found', 'storing') 
		  AND i.disposal_due_date < CURRENT_TIMESTAMP
		ORDER BY i.disposal_due_date ASC
	`
		)
		.all() as ItemWithJoined[];
}

export function getActivityLogs(itemId?: number, limit: number = 50): ActivityLogWithJoined[] {
	let query = `
		SELECT a.*, u.name as user_name
		FROM activity_logs a
		LEFT JOIN users u ON a.user_id = u.id
	`;
	const params: (string | number)[] = [];

	if (itemId) {
		query += 'WHERE a.item_id = ? ';
		params.push(itemId);
	}

	query += 'ORDER BY a.created_at DESC LIMIT ?';
	params.push(limit);

	return db.prepare(query).all(...params) as ActivityLogWithJoined[];
}
