import db, {
  type Library,
  type Reader,
  type Book,
  type ILLRequest,
  type ILLRequestDetail,
  type ILLRequestStatus,
  type LogisticsRecord,
  type Notification,
  type ExceptionRecord,
  type RenewalRequest,
  generateRequestNo
} from "./db";

export function getLibraries(): Library[] {
  return db.prepare("SELECT * FROM libraries ORDER BY name").all() as Library[];
}

export function getLibrary(id: number): Library | undefined {
  return db.prepare("SELECT * FROM libraries WHERE id = ?").get(id) as Library | undefined;
}

export function createLibrary(data: Omit<Library, "id" | "created_at">): Library {
  const stmt = db.prepare(`
    INSERT INTO libraries (name, code, address, contact_person, contact_email, contact_phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(data.name, data.code, data.address, data.contact_person, data.contact_email, data.contact_phone);
  return getLibrary(result.lastInsertRowid as number)!;
}

export function getReaders(): Reader[] {
  return db.prepare("SELECT * FROM readers ORDER BY name").all() as Reader[];
}

export function getReader(id: number): Reader | undefined {
  return db.prepare("SELECT * FROM readers WHERE id = ?").get(id) as Reader | undefined;
}

export function findReaderByCard(cardNumber: string): Reader | undefined {
  return db.prepare("SELECT * FROM readers WHERE card_number = ?").get(cardNumber) as Reader | undefined;
}

export function createReader(data: Omit<Reader, "id" | "created_at">): Reader {
  const stmt = db.prepare(`
    INSERT INTO readers (card_number, name, email, phone, department, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(data.card_number, data.name, data.email, data.phone, data.department, data.status);
  return getReader(result.lastInsertRowid as number)!;
}

export function getBooks(): Book[] {
  return db.prepare("SELECT * FROM books ORDER BY title").all() as Book[];
}

export function getBook(id: number): Book | undefined {
  return db.prepare("SELECT * FROM books WHERE id = ?").get(id) as Book | undefined;
}

export function searchBooks(query: string, libraryId?: number): Book[] {
  let sql = "SELECT * FROM books WHERE (title LIKE ? OR author LIKE ? OR isbn LIKE ?)";
  const params: string[] = [`%${query}%`, `%${query}%`, `%${query}%`];
  
  if (libraryId) {
    sql += " AND library_id = ?";
    params.push(String(libraryId));
  }
  
  sql += " ORDER BY title";
  return db.prepare(sql).all(...params) as Book[];
}

export function getAvailableBooks(libraryId?: number): Book[] {
  let sql = "SELECT * FROM books WHERE status = 'available'";
  const params: string[] = [];
  
  if (libraryId) {
    sql += " AND library_id != ?";
    params.push(String(libraryId));
  }
  
  sql += " ORDER BY title";
  return db.prepare(sql).all(...params) as Book[];
}

export function createBook(data: Omit<Book, "id" | "created_at">): Book {
  const stmt = db.prepare(`
    INSERT INTO books (isbn, title, author, publisher, publish_year, category, location, status, library_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.isbn, data.title, data.author, data.publisher, data.publish_year,
    data.category, data.location, data.status, data.library_id
  );
  return getBook(result.lastInsertRowid as number)!;
}

export function getILLRequests(filters?: {
  status?: ILLRequestStatus;
  readerId?: number;
  libraryId?: number;
}): ILLRequestDetail[] {
  let sql = `
    SELECT 
      ir.*,
      r.name as reader_name,
      r.card_number as reader_card,
      b.title as book_title,
      b.isbn as book_isbn,
      b.author as book_author,
      lr.name as requesting_library_name,
      ls.name as supplying_library_name
    FROM ill_requests ir
    JOIN readers r ON ir.reader_id = r.id
    JOIN books b ON ir.book_id = b.id
    JOIN libraries lr ON ir.requesting_library_id = lr.id
    LEFT JOIN libraries ls ON ir.supplying_library_id = ls.id
    WHERE 1=1
  `;
  
  const params: (string | number)[] = [];
  
  if (filters?.status) {
    sql += " AND ir.status = ?";
    params.push(filters.status);
  }
  
  if (filters?.readerId) {
    sql += " AND ir.reader_id = ?";
    params.push(filters.readerId);
  }
  
  if (filters?.libraryId) {
    sql += " AND (ir.requesting_library_id = ? OR ir.supplying_library_id = ?)";
    params.push(filters.libraryId, filters.libraryId);
  }
  
  sql += " ORDER BY ir.created_at DESC";
  
  return db.prepare(sql).all(...params) as ILLRequestDetail[];
}

export function getILLRequest(id: number): ILLRequestDetail | undefined {
  const sql = `
    SELECT 
      ir.*,
      r.name as reader_name,
      r.card_number as reader_card,
      b.title as book_title,
      b.isbn as book_isbn,
      b.author as book_author,
      lr.name as requesting_library_name,
      ls.name as supplying_library_name
    FROM ill_requests ir
    JOIN readers r ON ir.reader_id = r.id
    JOIN books b ON ir.book_id = b.id
    JOIN libraries lr ON ir.requesting_library_id = lr.id
    LEFT JOIN libraries ls ON ir.supplying_library_id = ls.id
    WHERE ir.id = ?
  `;
  
  return db.prepare(sql).get(id) as ILLRequestDetail | undefined;
}

export function createILLRequest(data: {
  reader_id: number;
  book_id: number;
  requesting_library_id: number;
  purpose: string;
  required_date?: string;
}): ILLRequest {
  const requestNo = generateRequestNo();
  const requestDate = new Date().toISOString().split("T")[0];
  
  const stmt = db.prepare(`
    INSERT INTO ill_requests 
    (request_no, reader_id, book_id, requesting_library_id, purpose, request_date, required_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `);
  
  const result = stmt.run(
    requestNo,
    data.reader_id,
    data.book_id,
    data.requesting_library_id,
    data.purpose,
    requestDate,
    data.required_date || null
  );
  
  return db.prepare("SELECT * FROM ill_requests WHERE id = ?").get(result.lastInsertRowid) as ILLRequest;
}

export function updateILLRequestStatus(id: number, status: ILLRequestStatus, notes?: string): void {
  const sql = notes 
    ? "UPDATE ill_requests SET status = ?, notes = COALESCE(notes, '') || ? || CHAR(10), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    : "UPDATE ill_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
  
  const params = notes ? [status, `[${new Date().toISOString()}] ${notes}`, id] : [status, id];
  db.prepare(sql).run(...params);
}

export function matchSupplyingLibrary(requestId: number, libraryId: number): void {
  db.prepare(`
    UPDATE ill_requests 
    SET supplying_library_id = ?, status = 'matched', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(libraryId, requestId);
}

export function approveLending(requestId: number): void {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  
  db.prepare(`
    UPDATE ill_requests 
    SET status = 'approved', due_date = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(dueDate.toISOString().split("T")[0], requestId);
  
  const req = getILLRequest(requestId);
  if (req) {
    db.prepare("UPDATE books SET status = 'reserved' WHERE id = ?").run(req.book_id);
  }
}

export function shipBook(requestId: number, logistics: Omit<LogisticsRecord, "id" | "type" | "created_at">): void {
  updateILLRequestStatus(requestId, "shipped");
  
  db.prepare(`
    INSERT INTO logistics_records 
    (ill_request_id, type, tracking_number, carrier, sender_name, sender_contact, receiver_name, receiver_contact, send_date)
    VALUES (?, 'ship', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    requestId,
    logistics.tracking_number,
    logistics.carrier,
    logistics.sender_name,
    logistics.sender_contact,
    logistics.receiver_name,
    logistics.receiver_contact,
    logistics.send_date
  );
  
  const req = getILLRequest(requestId);
  if (req) {
    db.prepare("UPDATE books SET status = 'borrowed' WHERE id = ?").run(req.book_id);
  }
}

export function receiveBook(requestId: number): void {
  updateILLRequestStatus(requestId, "received");
  
  db.prepare(`
    UPDATE logistics_records 
    SET receive_date = ? 
    WHERE ill_request_id = ? AND type = 'ship' AND receive_date IS NULL
  `).run(new Date().toISOString().split("T")[0], requestId);
}

export function startLending(requestId: number): void {
  updateILLRequestStatus(requestId, "lending");
  
  const req = getILLRequest(requestId);
  if (req && req.reader_email) {
    createNotification({
      ill_request_id: requestId,
      type: "arrival",
      recipient: req.reader_email,
      subject: "馆际互借图书已到馆",
      content: `您申请的图书《${req.book_title}》已到馆，请及时前来借阅。`
    });
  }
}

export function createRenewalRequest(data: Omit<RenewalRequest, "id">): RenewalRequest {
  const stmt = db.prepare(`
    INSERT INTO renewal_requests 
    (ill_request_id, requested_by, request_date, reason, new_due_date, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);
  
  const result = stmt.run(
    data.ill_request_id,
    data.requested_by,
    data.request_date,
    data.reason,
    data.new_due_date
  );
  
  updateILLRequestStatus(data.ill_request_id, "renew_requested");
  
  return db.prepare("SELECT * FROM renewal_requests WHERE id = ?").get(result.lastInsertRowid) as RenewalRequest;
}

export function approveRenewal(renewalId: number, approvedBy: string): void {
  const renewal = db.prepare("SELECT * FROM renewal_requests WHERE id = ?").get(renewalId) as RenewalRequest;
  
  db.prepare(`
    UPDATE renewal_requests 
    SET status = 'approved', approved_by = ?, approved_date = ? 
    WHERE id = ?
  `).run(approvedBy, new Date().toISOString().split("T")[0], renewalId);
  
  db.prepare(`
    UPDATE ill_requests 
    SET status = 'renew_approved', due_date = ?, renewal_count = renewal_count + 1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(renewal.new_due_date, renewal.ill_request_id);
}

export function rejectRenewal(renewalId: number, approvedBy: string, notes: string): void {
  const renewal = db.prepare("SELECT * FROM renewal_requests WHERE id = ?").get(renewalId) as RenewalRequest;
  
  db.prepare(`
    UPDATE renewal_requests 
    SET status = 'rejected', approved_by = ?, approved_date = ?, notes = ? 
    WHERE id = ?
  `).run(approvedBy, new Date().toISOString().split("T")[0], notes, renewalId);
  
  db.prepare(`
    UPDATE ill_requests 
    SET status = 'lending', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(renewal.ill_request_id);
}

export function getRenewalRequests(illRequestId?: number): RenewalRequest[] {
  let sql = "SELECT * FROM renewal_requests";
  const params: number[] = [];
  
  if (illRequestId) {
    sql += " WHERE ill_request_id = ?";
    params.push(illRequestId);
  }
  
  sql += " ORDER BY request_date DESC";
  return db.prepare(sql).all(...params) as RenewalRequest[];
}

export function returnBook(requestId: number): void {
  updateILLRequestStatus(requestId, "returned");
  
  db.prepare("UPDATE ill_requests SET return_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(new Date().toISOString().split("T")[0], requestId);
}

export function completeRequest(requestId: number): void {
  updateILLRequestStatus(requestId, "completed");
  
  const req = getILLRequest(requestId);
  if (req) {
    db.prepare("UPDATE books SET status = 'available' WHERE id = ?").run(req.book_id);
  }
}

export function rejectRequest(requestId: number, reason: string): void {
  updateILLRequestStatus(requestId, "rejected", reason);
}

export function cancelRequest(requestId: number): void {
  updateILLRequestStatus(requestId, "cancelled");
}

export function getLogisticsRecords(requestId: number): LogisticsRecord[] {
  return db.prepare("SELECT * FROM logistics_records WHERE ill_request_id = ? ORDER BY created_at DESC")
    .all(requestId) as LogisticsRecord[];
}

export function createNotification(data: Omit<Notification, "id">): Notification {
  const stmt = db.prepare(`
    INSERT INTO notifications (ill_request_id, type, recipient, subject, content)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(data.ill_request_id, data.type, data.recipient, data.subject, data.content);
  return db.prepare("SELECT * FROM notifications WHERE id = ?").get(result.lastInsertRowid) as Notification;
}

export function getNotifications(recipient?: string): Notification[] {
  let sql = "SELECT * FROM notifications";
  const params: string[] = [];
  
  if (recipient) {
    sql += " WHERE recipient = ?";
    params.push(recipient);
  }
  
  sql += " ORDER BY sent_at DESC, id DESC";
  return db.prepare(sql).all(...params) as Notification[];
}

export function createException(data: Omit<ExceptionRecord, "id" | "status">): ExceptionRecord {
  const stmt = db.prepare(`
    INSERT INTO exception_records 
    (ill_request_id, type, description, reported_by, reported_at, status)
    VALUES (?, ?, ?, ?, ?, 'open')
  `);
  
  const result = stmt.run(data.ill_request_id, data.type, data.description, data.reported_by, data.reported_at);
  return db.prepare("SELECT * FROM exception_records WHERE id = ?").get(result.lastInsertRowid) as ExceptionRecord;
}

export function getExceptions(status?: ExceptionRecord["status"]): ExceptionRecord[] {
  let sql = "SELECT * FROM exception_records";
  const params: string[] = [];
  
  if (status) {
    sql += " WHERE status = ?";
    params.push(status);
  }
  
  sql += " ORDER BY reported_at DESC";
  return db.prepare(sql).all(...params) as ExceptionRecord[];
}

export function resolveException(id: number, resolution: string): void {
  db.prepare(`
    UPDATE exception_records 
    SET status = 'resolved', resolution = ?, resolved_at = ? 
    WHERE id = ?
  `).run(resolution, new Date().toISOString().split("T")[0], id);
}

export function checkOverdue(): ILLRequestDetail[] {
  const today = new Date().toISOString().split("T")[0];
  
  const requests = db.prepare(`
    SELECT 
      ir.*,
      r.name as reader_name,
      r.card_number as reader_card,
      r.email as reader_email,
      b.title as book_title,
      b.isbn as book_isbn,
      b.author as book_author,
      lr.name as requesting_library_name,
      ls.name as supplying_library_name
    FROM ill_requests ir
    JOIN readers r ON ir.reader_id = r.id
    JOIN books b ON ir.book_id = b.id
    JOIN libraries lr ON ir.requesting_library_id = lr.id
    LEFT JOIN libraries ls ON ir.supplying_library_id = ls.id
    WHERE ir.status IN ('lending', 'renew_approved') 
      AND ir.due_date < ?
  `).all(today) as ILLRequestDetail[];
  
  for (const req of requests) {
    updateILLRequestStatus(req.id, "overdue");
  }
  
  return requests;
}

export function getDashboardStats() {
  const total = db.prepare("SELECT COUNT(*) as count FROM ill_requests").get() as { count: number };
  const pending = db.prepare("SELECT COUNT(*) as count FROM ill_requests WHERE status = 'pending'").get() as { count: number };
  const lending = db.prepare("SELECT COUNT(*) as count FROM ill_requests WHERE status IN ('lending', 'renew_approved', 'renew_requested')").get() as { count: number };
  const overdue = db.prepare("SELECT COUNT(*) as count FROM ill_requests WHERE status = 'overdue'").get() as { count: number };
  const completed = db.prepare("SELECT COUNT(*) as count FROM ill_requests WHERE status = 'completed'").get() as { count: number };
  
  return {
    total: total.count,
    pending: pending.count,
    lending: lending.count,
    overdue: overdue.count,
    completed: completed.count
  };
}
