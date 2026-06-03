import Database from "better-sqlite3";
import { join } from "path";

const dbPath = process.env.DB_PATH || join(process.cwd(), "data", "library.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export interface Library {
  id: number;
  name: string;
  code: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
}

export interface Reader {
  id: number;
  card_number: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  status: "active" | "inactive" | "suspended";
  created_at: string;
}

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publish_year: number;
  category: string;
  location: string;
  status: "available" | "borrowed" | "lost" | "reserved";
  library_id: number;
  created_at: string;
}

export type ILLRequestStatus =
  | "pending"
  | "matched"
  | "approved"
  | "shipped"
  | "received"
  | "lending"
  | "renew_requested"
  | "renew_approved"
  | "overdue"
  | "returned"
  | "completed"
  | "rejected"
  | "cancelled";

export interface ILLRequest {
  id: number;
  request_no: string;
  reader_id: number;
  book_id: number;
  requesting_library_id: number;
  supplying_library_id: number | null;
  status: ILLRequestStatus;
  purpose: string;
  request_date: string;
  required_date: string | null;
  due_date: string | null;
  return_date: string | null;
  renewal_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ILLRequestDetail extends ILLRequest {
  reader_name: string;
  reader_card: string;
  book_title: string;
  book_isbn: string;
  book_author: string;
  requesting_library_name: string;
  supplying_library_name: string | null;
}

export interface LogisticsRecord {
  id: number;
  ill_request_id: number;
  type: "ship" | "return" | "receive";
  tracking_number: string;
  carrier: string;
  sender_name: string;
  sender_contact: string;
  receiver_name: string;
  receiver_contact: string;
  send_date: string;
  receive_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  ill_request_id: number;
  type: "arrival" | "due" | "overdue" | "renewal" | "status";
  recipient: string;
  subject: string;
  content: string;
  sent_at: string | null;
  read_at: string | null;
}

export interface ExceptionRecord {
  id: number;
  ill_request_id: number;
  type: "damage" | "lost" | "delay" | "other";
  description: string;
  reported_by: string;
  reported_at: string;
  resolution: string | null;
  resolved_at: string | null;
  status: "open" | "processing" | "resolved";
}

export interface RenewalRequest {
  id: number;
  ill_request_id: number;
  requested_by: string;
  request_date: string;
  reason: string;
  new_due_date: string;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_date: string | null;
  notes: string | null;
}

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS libraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      address TEXT,
      contact_person TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS readers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      department TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT,
      title TEXT NOT NULL,
      author TEXT,
      publisher TEXT,
      publish_year INTEGER,
      category TEXT,
      location TEXT,
      status TEXT DEFAULT 'available',
      library_id INTEGER REFERENCES libraries(id),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ill_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_no TEXT UNIQUE NOT NULL,
      reader_id INTEGER NOT NULL REFERENCES readers(id),
      book_id INTEGER NOT NULL REFERENCES books(id),
      requesting_library_id INTEGER NOT NULL REFERENCES libraries(id),
      supplying_library_id INTEGER REFERENCES libraries(id),
      status TEXT DEFAULT 'pending',
      purpose TEXT,
      request_date TEXT NOT NULL,
      required_date TEXT,
      due_date TEXT,
      return_date TEXT,
      renewal_count INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS logistics_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ill_request_id INTEGER NOT NULL REFERENCES ill_requests(id),
      type TEXT NOT NULL,
      tracking_number TEXT,
      carrier TEXT,
      sender_name TEXT,
      sender_contact TEXT,
      receiver_name TEXT,
      receiver_contact TEXT,
      send_date TEXT NOT NULL,
      receive_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ill_request_id INTEGER NOT NULL REFERENCES ill_requests(id),
      type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      sent_at TEXT,
      read_at TEXT
    );

    CREATE TABLE IF NOT EXISTS exception_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ill_request_id INTEGER NOT NULL REFERENCES ill_requests(id),
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      reported_by TEXT NOT NULL,
      reported_at TEXT NOT NULL,
      resolution TEXT,
      resolved_at TEXT,
      status TEXT DEFAULT 'open'
    );

    CREATE TABLE IF NOT EXISTS renewal_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ill_request_id INTEGER NOT NULL REFERENCES ill_requests(id),
      requested_by TEXT NOT NULL,
      request_date TEXT NOT NULL,
      reason TEXT,
      new_due_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      approved_by TEXT,
      approved_date TEXT,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_ill_requests_status ON ill_requests(status);
    CREATE INDEX IF NOT EXISTS idx_ill_requests_reader ON ill_requests(reader_id);
    CREATE INDEX IF NOT EXISTS idx_ill_requests_due ON ill_requests(due_date);
    CREATE INDEX IF NOT EXISTS idx_logistics_request ON logistics_records(ill_request_id);
  `);
}

export function generateRequestNo(): string {
  const date = new Date();
  const prefix = `ILL${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const stmt = db.prepare("SELECT COUNT(*) as count FROM ill_requests WHERE request_no LIKE ?");
  const result = stmt.get(`${prefix}%`) as { count: number };
  return `${prefix}${String(result.count + 1).padStart(4, "0")}`;
}

export default db;
