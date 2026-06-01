import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

const DB_PATH = 'data/ill.db'

mkdirSync(dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    email TEXT,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS partner_libraries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    province TEXT,
    city TEXT,
    cooperation_level TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS library_holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    library_id INTEGER NOT NULL,
    isbn TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT,
    call_number TEXT,
    available INTEGER NOT NULL DEFAULT 1,
    location TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (library_id) REFERENCES partner_libraries(id)
  );

  CREATE TABLE IF NOT EXISTS interlibrary_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_no TEXT NOT NULL UNIQUE,
    isbn TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    publisher TEXT,
    reader_name TEXT NOT NULL,
    reader_phone TEXT,
    reader_email TEXT,
    library_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    request_type TEXT NOT NULL DEFAULT 'borrow',
    purpose TEXT,
    due_date TEXT,
    actual_return_date TEXT,
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (library_id) REFERENCES partner_libraries(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS shipping_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    carrier TEXT,
    tracking_number TEXT,
    shipped_date TEXT,
    estimated_arrival TEXT,
    actual_arrival TEXT,
    return_tracking_number TEXT,
    return_shipped_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (request_id) REFERENCES interlibrary_requests(id)
  );

  CREATE TABLE IF NOT EXISTS renewal_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    original_due_date TEXT NOT NULL,
    requested_due_date TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by INTEGER,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (request_id) REFERENCES interlibrary_requests(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS overdue_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    overdue_days INTEGER NOT NULL DEFAULT 0,
    reminder_count INTEGER NOT NULL DEFAULT 0,
    last_reminder_date TEXT,
    fine_amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (request_id) REFERENCES interlibrary_requests(id)
  );

  CREATE TABLE IF NOT EXISTS exception_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    handler_id INTEGER,
    handler_name TEXT,
    resolution TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (request_id) REFERENCES interlibrary_requests(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS status_transitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    operated_by INTEGER NOT NULL,
    operator_name TEXT NOT NULL,
    remark TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (request_id) REFERENCES interlibrary_requests(id),
    FOREIGN KEY (operated_by) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_requests_status ON interlibrary_requests(status);
  CREATE INDEX IF NOT EXISTS idx_requests_library ON interlibrary_requests(library_id);
  CREATE INDEX IF NOT EXISTS idx_requests_reader ON interlibrary_requests(reader_name);
  CREATE INDEX IF NOT EXISTS idx_requests_created ON interlibrary_requests(created_at);
  CREATE INDEX IF NOT EXISTS idx_holdings_isbn ON library_holdings(isbn);
  CREATE INDEX IF NOT EXISTS idx_holdings_library ON library_holdings(library_id);
  CREATE INDEX IF NOT EXISTS idx_transitions_request ON status_transitions(request_id);
  CREATE INDEX IF NOT EXISTS idx_overdue_request ON overdue_records(request_id);
  CREATE INDEX IF NOT EXISTS idx_exceptions_request ON exception_records(request_id);
  CREATE INDEX IF NOT EXISTS idx_renewal_request ON renewal_requests(request_id);
  CREATE INDEX IF NOT EXISTS idx_shipping_request ON shipping_records(request_id);
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }

if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (name, role, email, phone) VALUES (?, ?, ?, ?)
  `)

  const insertLibrary = db.prepare(`
    INSERT INTO partner_libraries (name, code, contact_person, contact_phone, contact_email, address, province, city, cooperation_level, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertHolding = db.prepare(`
    INSERT INTO library_holdings (library_id, isbn, title, author, publisher, call_number, available, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertRequest = db.prepare(`
    INSERT INTO interlibrary_requests (request_no, isbn, title, author, publisher, reader_name, reader_phone, reader_email, library_id, status, request_type, purpose, due_date, actual_return_date, notes, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertTransition = db.prepare(`
    INSERT INTO status_transitions (request_id, from_status, to_status, operated_by, operator_name, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertShipping = db.prepare(`
    INSERT INTO shipping_records (request_id, carrier, tracking_number, shipped_date, estimated_arrival, actual_arrival, return_tracking_number, return_shipped_date, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertRenewal = db.prepare(`
    INSERT INTO renewal_requests (request_id, original_due_date, requested_due_date, reason, status, reviewed_by, reviewed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertOverdue = db.prepare(`
    INSERT INTO overdue_records (request_id, due_date, overdue_days, reminder_count, last_reminder_date, fine_amount, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertException = db.prepare(`
    INSERT INTO exception_records (request_id, type, description, handler_id, handler_name, resolution, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  db.transaction(() => {
    insertUser.run('张明远', 'admin', 'zhangmy@library.cn', '13800138001')
    insertUser.run('李书华', 'staff', 'lish@library.cn', '13800138002')
    insertUser.run('王晓芳', 'staff', 'wangxf@library.cn', '13800138003')

    insertLibrary.run('北京大学图书馆', 'PKU-LIB', '赵建国', '010-62755501', 'zjg@pku.edu.cn', '北京市海淀区颐和园路5号', '北京', '北京', 'key', 'active')
    insertLibrary.run('清华大学图书馆', 'THU-LIB', '孙丽华', '010-62783067', 'sunlh@tsinghua.edu.cn', '北京市海淀区清华园1号', '北京', '北京', 'key', 'active')
    insertLibrary.run('复旦大学图书馆', 'FDU-LIB', '周文博', '021-65643215', 'zhouwb@fudan.edu.cn', '上海市杨浦区邯郸路220号', '上海', '上海', 'important', 'active')
    insertLibrary.run('南京大学图书馆', 'NJU-LIB', '陈思远', '025-83593571', 'chensy@nju.edu.cn', '江苏省南京市栖霞区仙林大道163号', '江苏', '南京', 'important', 'active')
    insertLibrary.run('浙江大学图书馆', 'ZJU-LIB', '林雅婷', '0571-87951760', 'linyt@zju.edu.cn', '浙江省杭州市西湖区浙大路38号', '浙江', '杭州', 'normal', 'active')

    insertHolding.run(1, '978-7-020-00220-1', '红楼梦', '曹雪芹', '人民文学出版社', 'I242.4/1', 1, '文科阅览室A区')
    insertHolding.run(1, '978-7-020-00875-3', '三国演义', '罗贯中', '人民文学出版社', 'I242.4/2', 1, '文科阅览室A区')
    insertHolding.run(2, '978-7-020-00875-3', '三国演义', '罗贯中', '人民文学出版社', 'I242.4/5', 0, '特藏室')
    insertHolding.run(2, '978-7-040-23869-8', '高等数学（第七版）', '同济大学数学系', '高等教育出版社', 'O13/12', 1, '理科阅览室B区')
    insertHolding.run(3, '978-7-020-00220-1', '红楼梦', '曹雪芹', '人民文学出版社', 'I242.4/8', 1, '文学阅览室')
    insertHolding.run(3, '978-7-111-40891-5', '数据结构与算法分析', 'Mark Allen Weiss', '机械工业出版社', 'TP311.12/33', 1, '计算机阅览室')
    insertHolding.run(4, '978-7-040-23869-8', '高等数学（第七版）', '同济大学数学系', '高等教育出版社', 'O13/25', 1, '理学分馆')
    insertHolding.run(4, '978-7-020-00220-1', '红楼梦', '曹雪芹', '人民文学出版社', 'I242.4/15', 1, '文学分馆')
    insertHolding.run(5, '978-7-111-40891-5', '数据结构与算法分析', 'Mark Allen Weiss', '机械工业出版社', 'TP311.12/45', 0, '信息分馆')
    insertHolding.run(5, '978-7-020-00875-3', '三国演义', '罗贯中', '人民文学出版社', 'I242.4/20', 1, '文学分馆')
    insertHolding.run(1, '978-7-302-19886-4', '计算机网络（第6版）', '谢希仁', '清华大学出版社', 'TP393/18', 1, '计算机阅览室')
    insertHolding.run(3, '978-7-302-19886-4', '计算机网络（第6版）', '谢希仁', '清华大学出版社', 'TP393/22', 1, '工学阅览室')
    insertHolding.run(2, '978-7-020-00220-1', '红楼梦', '曹雪芹', '人民文学出版社', 'I242.4/30', 1, '文学阅览室')
    insertHolding.run(4, '978-7-111-40891-5', '数据结构与算法分析', 'Mark Allen Weiss', '机械工业出版社', 'TP311.12/50', 1, '计算机分馆')

    insertRequest.run('ILL-20260501-001', '978-7-020-00220-1', '红楼梦', '曹雪芹', '人民文学出版社', '刘思远', '13900139001', 'liusy@mail.com', 1, 'completed', 'borrow', '学术研究', '2026-05-20', '2026-05-18', '用于论文写作', 1, '2026-05-01 09:15:00', '2026-05-18 14:30:00')
    insertRequest.run('ILL-20260502-001', '978-7-040-23869-8', '高等数学（第七版）', '同济大学数学系', '高等教育出版社', '张伟明', '13900139002', 'zhangwm@mail.com', 2, 'completed', 'borrow', '备课参考', '2026-05-22', '2026-05-21', '教学需要', 1, '2026-05-02 10:30:00', '2026-05-21 16:00:00')
    insertRequest.run('ILL-20260503-001', '978-7-111-40891-5', '数据结构与算法分析', 'Mark Allen Weiss', '机械工业出版社', '王浩然', '13900139003', 'wanghr@mail.com', 3, 'reading', 'borrow', '课程学习', '2026-06-15', null, '', 2, '2026-05-03 11:00:00', '2026-05-12 09:30:00')
    insertRequest.run('ILL-20260504-001', '978-7-020-00875-3', '三国演义', '罗贯中', '人民文学出版社', '陈美玲', '13900139004', 'chenml@mail.com', 1, 'in_transit', 'borrow', '阅读兴趣', '2026-06-20', null, '', 1, '2026-05-04 14:20:00', '2026-05-25 10:00:00')
    insertRequest.run('ILL-20260505-001', '978-7-302-19886-4', '计算机网络（第6版）', '谢希仁', '清华大学出版社', '赵子轩', '13900139005', 'zhaozx@mail.com', 2, 'shipping_out', 'borrow', '课程实验', '2026-06-25', null, '', 2, '2026-05-05 08:45:00', '2026-05-28 11:00:00')
    insertRequest.run('ILL-20260506-001', '978-7-020-00220-1', '红楼梦', '曹雪芹', '人民文学出版社', '孙雨萱', '13900139006', 'sunyx@mail.com', 4, 'approved', 'borrow', '毕业论文', '2026-07-01', null, '急需使用', 1, '2026-05-06 15:30:00', '2026-05-08 10:00:00')
    insertRequest.run('ILL-20260507-001', '978-7-040-23869-8', '高等数学（第七版）', '同济大学数学系', '高等教育出版社', '周静怡', '13900139007', 'zhoujy@mail.com', 1, 'pending', 'borrow', '学习参考', '2026-07-05', null, '', 2, '2026-05-07 09:00:00', '2026-05-07 09:00:00')
    insertRequest.run('ILL-20260508-001', '978-7-111-40891-5', '数据结构与算法分析', 'Mark Allen Weiss', '机械工业出版社', '吴天宇', '13900139008', 'wuty@mail.com', 5, 'rejected', 'borrow', '自学', null, null, '对方馆藏不可外借', 1, '2026-05-08 13:00:00', '2026-05-09 09:00:00')
    insertRequest.run('ILL-20260510-001', '978-7-020-00875-3', '三国演义', '罗贯中', '人民文学出版社', '林小龙', '13900139009', 'linxl@mail.com', 3, 'renewal_pending', 'borrow', '文学研究', '2026-06-01', null, '', 1, '2026-05-10 10:00:00', '2026-05-28 09:00:00')
    insertRequest.run('ILL-20260512-001', '978-7-020-00220-1', '红楼梦', '曹雪芹', '人民文学出版社', '黄思远', '13900139010', 'huangsy@mail.com', 1, 'overdue', 'borrow', '文献查阅', '2026-05-20', null, '', 1, '2026-05-12 08:30:00', '2026-05-20 00:00:00')
    insertRequest.run('ILL-20260515-001', '978-7-302-19886-4', '计算机网络（第6版）', '谢希仁', '清华大学出版社', '郑雅琴', '13900139011', 'zhengyq@mail.com', 4, 'exception', 'borrow', '课程学习', '2026-06-10', null, '图书破损', 2, '2026-05-15 14:00:00', '2026-05-22 11:00:00')
    insertRequest.run('ILL-20260518-001', '978-7-020-00220-1', '红楼梦', '曹雪芹', '人民文学出版社', '许文博', '13900139012', 'xuwb@mail.com', 3, 'returning', 'borrow', '学术写作', '2026-06-18', null, '', 1, '2026-05-18 09:30:00', '2026-05-30 14:00:00')
    insertRequest.run('ILL-20260520-001', '978-7-040-23869-8', '高等数学（第七版）', '同济大学数学系', '高等教育出版社', '杨梦瑶', '13900139013', 'yangmy@mail.com', 2, 'arrived', 'borrow', '作业参考', '2026-06-28', null, '请尽快取书', 2, '2026-05-20 11:00:00', '2026-05-29 09:00:00')
    insertRequest.run('ILL-20260525-001', '978-7-020-00875-3', '三国演义', '罗贯中', '人民文学出版社', '何嘉伟', '13900139014', 'hejw@mail.com', 5, 'renewal_approved', 'borrow', '研究参考', '2026-07-10', null, '续借已批准', 1, '2026-05-25 16:00:00', '2026-05-29 10:00:00')
    insertRequest.run('ILL-20260528-001', '978-7-111-40891-5', '数据结构与算法分析', 'Mark Allen Weiss', '机械工业出版社', '马晓彤', '13900139015', 'maxt@mail.com', 1, 'pending', 'copy', '论文引用', null, null, '只需要第3-5章', 3, '2026-05-28 10:30:00', '2026-05-28 10:30:00')

    insertTransition.run(1, null, 'pending', 1, '张明远', '提交互借申请', '2026-05-01 09:15:00')
    insertTransition.run(1, 'pending', 'approved', 1, '张明远', '对方同意借出', '2026-05-02 10:00:00')
    insertTransition.run(1, 'approved', 'shipping_out', 1, '张明远', '已寄出', '2026-05-03 09:00:00')
    insertTransition.run(1, 'shipping_out', 'in_transit', 2, '李书华', '物流信息已更新', '2026-05-05 14:00:00')
    insertTransition.run(1, 'in_transit', 'arrived', 2, '李书华', '图书已到馆', '2026-05-08 10:30:00')
    insertTransition.run(1, 'arrived', 'reading', 1, '张明远', '读者已取书', '2026-05-09 11:00:00')
    insertTransition.run(1, 'reading', 'returning', 1, '张明远', '读者归还，准备寄回', '2026-05-17 15:00:00')
    insertTransition.run(1, 'returning', 'completed', 1, '张明远', '对方确认收到', '2026-05-18 14:30:00')

    insertTransition.run(2, null, 'pending', 1, '张明远', '提交互借申请', '2026-05-02 10:30:00')
    insertTransition.run(2, 'pending', 'approved', 2, '李书华', '审核通过', '2026-05-03 09:00:00')
    insertTransition.run(2, 'approved', 'shipping_out', 2, '李书华', '已寄出', '2026-05-04 11:00:00')
    insertTransition.run(2, 'shipping_out', 'in_transit', 2, '李书华', '运输中', '2026-05-06 09:00:00')
    insertTransition.run(2, 'in_transit', 'arrived', 2, '李书华', '已到馆', '2026-05-09 14:00:00')
    insertTransition.run(2, 'arrived', 'reading', 1, '张明远', '读者取书', '2026-05-10 10:00:00')
    insertTransition.run(2, 'reading', 'returning', 1, '张明远', '归还中', '2026-05-20 09:00:00')
    insertTransition.run(2, 'returning', 'completed', 1, '张明远', '流程结束', '2026-05-21 16:00:00')

    insertTransition.run(3, null, 'pending', 2, '李书华', '提交申请', '2026-05-03 11:00:00')
    insertTransition.run(3, 'pending', 'approved', 1, '张明远', '批准', '2026-05-04 09:00:00')
    insertTransition.run(3, 'approved', 'shipping_out', 2, '李书华', '寄出', '2026-05-06 10:00:00')
    insertTransition.run(3, 'shipping_out', 'in_transit', 2, '李书华', '运输中', '2026-05-08 14:00:00')
    insertTransition.run(3, 'in_transit', 'arrived', 2, '李书华', '到馆', '2026-05-11 09:30:00')
    insertTransition.run(3, 'arrived', 'reading', 1, '张明远', '取书', '2026-05-12 09:30:00')

    insertTransition.run(4, null, 'pending', 1, '张明远', '提交申请', '2026-05-04 14:20:00')
    insertTransition.run(4, 'pending', 'approved', 1, '张明远', '批准', '2026-05-05 09:00:00')
    insertTransition.run(4, 'approved', 'shipping_out', 2, '李书华', '寄出', '2026-05-10 10:00:00')
    insertTransition.run(4, 'shipping_out', 'in_transit', 2, '李书华', '运输中', '2026-05-25 10:00:00')

    insertTransition.run(5, null, 'pending', 2, '李书华', '提交申请', '2026-05-05 08:45:00')
    insertTransition.run(5, 'pending', 'approved', 2, '李书华', '批准', '2026-05-06 09:00:00')
    insertTransition.run(5, 'approved', 'shipping_out', 2, '李书华', '已寄出', '2026-05-28 11:00:00')

    insertTransition.run(6, null, 'pending', 1, '张明远', '提交申请', '2026-05-06 15:30:00')
    insertTransition.run(6, 'pending', 'approved', 1, '张明远', '批准', '2026-05-08 10:00:00')

    insertTransition.run(7, null, 'pending', 2, '李书华', '提交申请', '2026-05-07 09:00:00')

    insertTransition.run(8, null, 'pending', 1, '张明远', '提交申请', '2026-05-08 13:00:00')
    insertTransition.run(8, 'pending', 'rejected', 1, '张明远', '对方馆藏不可外借', '2026-05-09 09:00:00')

    insertTransition.run(9, null, 'pending', 1, '张明远', '提交申请', '2026-05-10 10:00:00')
    insertTransition.run(9, 'pending', 'approved', 1, '张明远', '批准', '2026-05-11 09:00:00')
    insertTransition.run(9, 'approved', 'shipping_out', 2, '李书华', '寄出', '2026-05-13 10:00:00')
    insertTransition.run(9, 'shipping_out', 'in_transit', 2, '李书华', '运输中', '2026-05-15 09:00:00')
    insertTransition.run(9, 'in_transit', 'arrived', 2, '李书华', '到馆', '2026-05-18 14:00:00')
    insertTransition.run(9, 'arrived', 'reading', 1, '张明远', '取书', '2026-05-19 10:00:00')
    insertTransition.run(9, 'reading', 'renewal_pending', 1, '张明远', '申请续借', '2026-05-28 09:00:00')

    insertTransition.run(10, null, 'pending', 1, '张明远', '提交申请', '2026-05-12 08:30:00')
    insertTransition.run(10, 'pending', 'approved', 1, '张明远', '批准', '2026-05-13 09:00:00')
    insertTransition.run(10, 'approved', 'shipping_out', 2, '李书华', '寄出', '2026-05-14 10:00:00')
    insertTransition.run(10, 'shipping_out', 'in_transit', 2, '李书华', '运输中', '2026-05-16 09:00:00')
    insertTransition.run(10, 'in_transit', 'arrived', 2, '李书华', '到馆', '2026-05-18 14:00:00')
    insertTransition.run(10, 'arrived', 'reading', 1, '张明远', '取书', '2026-05-19 10:00:00')
    insertTransition.run(10, 'reading', 'overdue', 1, '张明远', '已逾期', '2026-05-20 00:00:00')

    insertTransition.run(11, null, 'pending', 2, '李书华', '提交申请', '2026-05-15 14:00:00')
    insertTransition.run(11, 'pending', 'approved', 2, '李书华', '批准', '2026-05-16 09:00:00')
    insertTransition.run(11, 'approved', 'shipping_out', 2, '李书华', '寄出', '2026-05-17 10:00:00')
    insertTransition.run(11, 'shipping_out', 'in_transit', 2, '李书华', '运输中', '2026-05-19 09:00:00')
    insertTransition.run(11, 'in_transit', 'arrived', 2, '李书华', '到馆', '2026-05-21 14:00:00')
    insertTransition.run(11, 'arrived', 'reading', 1, '张明远', '取书', '2026-05-22 10:00:00')
    insertTransition.run(11, 'reading', 'exception', 1, '张明远', '图书破损', '2026-05-22 11:00:00')

    insertTransition.run(12, null, 'pending', 1, '张明远', '提交申请', '2026-05-18 09:30:00')
    insertTransition.run(12, 'pending', 'approved', 1, '张明远', '批准', '2026-05-19 09:00:00')
    insertTransition.run(12, 'approved', 'shipping_out', 2, '李书华', '寄出', '2026-05-21 10:00:00')
    insertTransition.run(12, 'shipping_out', 'in_transit', 2, '李书华', '运输中', '2026-05-23 09:00:00')
    insertTransition.run(12, 'in_transit', 'arrived', 2, '李书华', '到馆', '2026-05-25 14:00:00')
    insertTransition.run(12, 'arrived', 'reading', 1, '张明远', '取书', '2026-05-26 10:00:00')
    insertTransition.run(12, 'reading', 'returning', 1, '张明远', '归还中', '2026-05-30 14:00:00')

    insertTransition.run(13, null, 'pending', 2, '李书华', '提交申请', '2026-05-20 11:00:00')
    insertTransition.run(13, 'pending', 'approved', 2, '李书华', '批准', '2026-05-21 09:00:00')
    insertTransition.run(13, 'approved', 'shipping_out', 2, '李书华', '寄出', '2026-05-23 10:00:00')
    insertTransition.run(13, 'shipping_out', 'in_transit', 2, '李书华', '运输中', '2026-05-26 09:00:00')
    insertTransition.run(13, 'in_transit', 'arrived', 2, '李书华', '到馆', '2026-05-29 09:00:00')

    insertTransition.run(14, null, 'pending', 1, '张明远', '提交申请', '2026-05-25 16:00:00')
    insertTransition.run(14, 'pending', 'approved', 1, '张明远', '批准', '2026-05-26 09:00:00')
    insertTransition.run(14, 'approved', 'shipping_out', 2, '李书华', '寄出', '2026-05-27 10:00:00')
    insertTransition.run(14, 'shipping_out', 'in_transit', 2, '李书华', '运输中', '2026-05-27 14:00:00')
    insertTransition.run(14, 'in_transit', 'arrived', 2, '李书华', '到馆', '2026-05-28 09:00:00')
    insertTransition.run(14, 'arrived', 'reading', 1, '张明远', '取书', '2026-05-28 10:00:00')
    insertTransition.run(14, 'reading', 'renewal_pending', 1, '张明远', '申请续借', '2026-05-28 14:00:00')
    insertTransition.run(14, 'renewal_pending', 'renewal_approved', 1, '张明远', '续借批准', '2026-05-29 10:00:00')

    insertTransition.run(15, null, 'pending', 3, '王晓芳', '提交申请', '2026-05-28 10:30:00')

    insertShipping.run(1, '顺丰速运', 'SF1234567890', '2026-05-03', '2026-05-07', '2026-05-08', 'SF0987654321', '2026-05-17', '', '2026-05-03 09:00:00')
    insertShipping.run(2, '中通快递', 'ZT2345678901', '2026-05-04', '2026-05-08', '2026-05-09', 'ZT9876543210', '2026-05-20', '', '2026-05-04 11:00:00')
    insertShipping.run(3, '顺丰速运', 'SF3456789012', '2026-05-06', '2026-05-10', '2026-05-11', '', null, '', '2026-05-06 10:00:00')
    insertShipping.run(4, '京东物流', 'JD4567890123', '2026-05-10', '2026-05-28', null, '', null, '', '2026-05-10 10:00:00')
    insertShipping.run(5, '顺丰速运', 'SF5678901234', '2026-05-28', '2026-06-02', null, '', null, '', '2026-05-28 11:00:00')
    insertShipping.run(11, '中通快递', 'ZT6789012345', '2026-05-17', '2026-05-20', '2026-05-21', '', null, '', '2026-05-17 10:00:00')
    insertShipping.run(12, '顺丰速运', 'SF7890123456', '2026-05-21', '2026-05-24', '2026-05-25', 'SF6543210987', '2026-05-30', '', '2026-05-21 10:00:00')
    insertShipping.run(13, '京东物流', 'JD8901234567', '2026-05-23', '2026-05-27', '2026-05-29', '', null, '', '2026-05-23 10:00:00')
    insertShipping.run(14, '顺丰速运', 'SF9012345678', '2026-05-27', '2026-05-28', '2026-05-28', '', null, '', '2026-05-27 10:00:00')

    insertRenewal.run(9, '2026-06-01', '2026-06-30', '论文尚未完成，需要继续使用', 'pending', null, null, '2026-05-28 09:00:00')
    insertRenewal.run(14, '2026-06-20', '2026-07-10', '研究需要延期', 'approved', 1, '2026-05-29 10:00:00', '2026-05-28 14:00:00')

    insertOverdue.run(10, '2026-05-20', 12, 2, '2026-05-28', 6.00, 'active', '2026-05-20 00:00:00')

    insertException.run(11, 'damage', '收到的图书封面撕裂，内页有水渍', 1, '张明远', null, 'open', '2026-05-22 11:00:00', '2026-05-22 11:00:00')
    insertException.run(5, 'delay', '物流超过预计时间未到达', null, null, null, 'open', '2026-05-30 09:00:00', '2026-05-30 09:00:00')
  })()
}

export default db
