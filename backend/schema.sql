-- Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- restorer, librarian, expert
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ancient Books
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    dynasty TEXT,
    year TEXT,
    material TEXT,
    dimensions TEXT,
    page_count INTEGER,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, diagnosing, scheduled, repairing, reviewing, completed, archived
    entered_by TEXT NOT NULL,
    entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entered_by) REFERENCES users(id)
);

-- Diseases
CREATE TABLE IF NOT EXISTS diseases (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    type TEXT NOT NULL, -- acidification, moth_damage, mold, tear, stain, brittleness, other
    severity TEXT NOT NULL, -- mild, moderate, severe, critical
    location TEXT,
    description TEXT,
    diagnosed_by TEXT,
    diagnosed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (diagnosed_by) REFERENCES users(id)
);

-- Repair Processes
CREATE TABLE IF NOT EXISTS processes (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER,
    assignee TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, skipped
    order_index INTEGER NOT NULL DEFAULT 0,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (assignee) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- paper, adhesive, tool, chemical, other
    specification TEXT,
    unit TEXT NOT NULL,
    stock_quantity REAL NOT NULL DEFAULT 0,
    min_stock REAL NOT NULL DEFAULT 0,
    unit_price REAL,
    supplier TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Material Usage Records
CREATE TABLE IF NOT EXISTS material_usages (
    id TEXT PRIMARY KEY,
    process_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    used_by TEXT NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes(id),
    FOREIGN KEY (material_id) REFERENCES materials(id),
    FOREIGN KEY (used_by) REFERENCES users(id)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    type TEXT NOT NULL, -- disease_diagnosis, repair_process, final_archive
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, need_revision
    comments TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- Archives
CREATE TABLE IF NOT EXISTS archives (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- image, document, record, other
    file_path TEXT,
    file_size INTEGER,
    description TEXT,
    uploaded_by TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Schedules
CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    restorer_id TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (restorer_id) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_diseases_book_id ON diseases(book_id);
CREATE INDEX IF NOT EXISTS idx_diseases_type ON diseases(type);
CREATE INDEX IF NOT EXISTS idx_diseases_severity ON diseases(severity);
CREATE INDEX IF NOT EXISTS idx_processes_book_id ON processes(book_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON processes(status);
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_archives_book_id ON archives(book_id);
CREATE INDEX IF NOT EXISTS idx_schedules_restorer_id ON schedules(restorer_id);
