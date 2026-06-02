import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || 'data/cinema_lost_found.db';

const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			role TEXT NOT NULL CHECK (role IN ('manager', 'cleaner', 'reception')),
			password_hash TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS halls (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT UNIQUE NOT NULL,
			capacity INTEGER NOT NULL,
			is_active BOOLEAN DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS showtimes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			hall_id INTEGER NOT NULL,
			movie_name TEXT NOT NULL,
			start_time DATETIME NOT NULL,
			end_time DATETIME NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (hall_id) REFERENCES halls(id)
		);

		CREATE TABLE IF NOT EXISTS lockers (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			code TEXT UNIQUE NOT NULL,
			area TEXT NOT NULL,
			capacity TEXT CHECK (capacity IN ('small', 'medium', 'large')) DEFAULT 'medium',
			status TEXT CHECK (status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			item_code TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			description TEXT,
			category TEXT NOT NULL,
			color TEXT,
			distinguishing_features TEXT,
			images TEXT,
			status TEXT CHECK (status IN ('found', 'storing', 'claimed', 'returned', 'disposed', 'exception')) DEFAULT 'found',
			hall_id INTEGER,
			showtime_id INTEGER,
			found_location TEXT,
			found_time DATETIME NOT NULL,
			finder_id INTEGER NOT NULL,
			locker_id INTEGER,
			stored_at DATETIME,
			stored_by INTEGER,
			disposal_due_date DATETIME,
			disposed_at DATETIME,
			disposed_by INTEGER,
			disposal_reason TEXT,
			exception_note TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (hall_id) REFERENCES halls(id),
			FOREIGN KEY (showtime_id) REFERENCES showtimes(id),
			FOREIGN KEY (finder_id) REFERENCES users(id),
			FOREIGN KEY (locker_id) REFERENCES lockers(id),
			FOREIGN KEY (stored_by) REFERENCES users(id),
			FOREIGN KEY (disposed_by) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS claimants (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			phone TEXT NOT NULL,
			id_type TEXT CHECK (id_type IN ('id_card', 'passport', 'driver_license')),
			id_number TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS claims (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			item_id INTEGER NOT NULL,
			claimant_id INTEGER NOT NULL,
			status TEXT CHECK (status IN ('pending', 'verifying', 'approved', 'rejected', 'completed', 'cancelled')) DEFAULT 'pending',
			claim_time DATETIME DEFAULT CURRENT_TIMESTAMP,
			verification_time DATETIME,
			verified_by INTEGER,
			verification_notes TEXT,
			return_time DATETIME,
			returned_by INTEGER,
			signature_image TEXT,
			rejection_reason TEXT,
			sign_receiver TEXT,
			sign_id_last4 TEXT,
			sign_voucher TEXT,
			sign_notes TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (item_id) REFERENCES items(id),
			FOREIGN KEY (claimant_id) REFERENCES claimants(id),
			FOREIGN KEY (verified_by) REFERENCES users(id),
			FOREIGN KEY (returned_by) REFERENCES users(id)
		);

		CREATE TABLE IF NOT EXISTS activity_logs (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			item_id INTEGER,
			claim_id INTEGER,
			user_id INTEGER,
			action TEXT NOT NULL,
			details TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (item_id) REFERENCES items(id),
			FOREIGN KEY (claim_id) REFERENCES claims(id),
			FOREIGN KEY (user_id) REFERENCES users(id)
		);

		CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
		CREATE INDEX IF NOT EXISTS idx_items_locker ON items(locker_id);
		CREATE INDEX IF NOT EXISTS idx_items_showtime ON items(showtime_id);
		CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
		CREATE INDEX IF NOT EXISTS idx_showtimes_date ON showtimes(start_time);
	`);

	const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
	if (usersCount.count === 0) {
		const insertUser = db.prepare(
			'INSERT INTO users (username, name, role, password_hash) VALUES (?, ?, ?, ?)'
		);
		insertUser.run('manager', '张经理', 'manager', 'hash_manager_123');
		insertUser.run('cleaner1', '李阿姨', 'cleaner', 'hash_cleaner_123');
		insertUser.run('cleaner2', '王阿姨', 'cleaner', 'hash_cleaner_456');
		insertUser.run('reception1', '刘前台', 'reception', 'hash_reception_123');
	}

	const hallsCount = db.prepare('SELECT COUNT(*) as count FROM halls').get() as { count: number };
	if (hallsCount.count === 0) {
		const insertHall = db.prepare('INSERT INTO halls (name, capacity) VALUES (?, ?)');
		for (let i = 1; i <= 10; i++) {
			insertHall.run(`${i}号厅`, i === 1 ? 200 : i === 2 ? 150 : 100);
		}
	}

	const lockersCount = db.prepare('SELECT COUNT(*) as count FROM lockers').get() as { count: number };
	if (lockersCount.count === 0) {
		const insertLocker = db.prepare(
			'INSERT INTO lockers (code, area, capacity) VALUES (?, ?, ?)'
		);
		const areas = ['A区', 'B区', 'C区'];
		const capacities: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
		for (const area of areas) {
			for (let i = 1; i <= 10; i++) {
				insertLocker.run(`${area.charAt(0)}-${String(i).padStart(2, '0')}`, area, capacities[(i - 1) % 3]);
			}
		}
	}
}
