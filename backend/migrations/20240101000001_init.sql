CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    real_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('cold_chain_admin', 'cdc_reviewer', 'vaccination_site_manager')),
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cold_storages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    min_temp REAL NOT NULL DEFAULT 2.0,
    max_temp REAL NOT NULL DEFAULT 8.0,
    status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal', 'maintenance', 'decommissioned')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transport_boxes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    model TEXT,
    capacity INTEGER NOT NULL,
    min_temp REAL NOT NULL DEFAULT 2.0,
    max_temp REAL NOT NULL DEFAULT 8.0,
    current_location TEXT,
    status TEXT NOT NULL DEFAULT 'idle' CHECK(status IN ('idle', 'in_transit', 'maintenance')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vaccine_batches (
    id TEXT PRIMARY KEY,
    batch_no TEXT UNIQUE NOT NULL,
    vaccine_name TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    production_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    total_quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL,
    storage_location_type TEXT NOT NULL CHECK(storage_location_type IN ('cold_storage', 'transport_box', 'vaccination_site')),
    storage_location_id TEXT NOT NULL,
    current_location TEXT,
    status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal', 'quarantined', 'released', 'recalled', 'destroyed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE temperature_records (
    id TEXT PRIMARY KEY,
    device_type TEXT NOT NULL CHECK(device_type IN ('cold_storage', 'transport_box')),
    device_id TEXT NOT NULL,
    temperature REAL NOT NULL,
    recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_normal BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE temperature_deviations (
    id TEXT PRIMARY KEY,
    device_type TEXT NOT NULL CHECK(device_type IN ('cold_storage', 'transport_box')),
    device_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    deviation_type TEXT NOT NULL CHECK(deviation_type IN ('over_temp', 'under_temp', 'fluctuation')),
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration_minutes INTEGER DEFAULT 0,
    max_temp REAL,
    min_temp REAL,
    avg_temp REAL,
    affected_batches TEXT,
    risk_level TEXT NOT NULL DEFAULT 'medium' CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'detected' CHECK(status IN ('detected', 'processing', 'verified', 'resolved', 'closed')),
    handler_id TEXT REFERENCES users(id),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quarantine_records (
    id TEXT PRIMARY KEY,
    deviation_id TEXT REFERENCES temperature_deviations(id),
    batch_id TEXT REFERENCES vaccine_batches(id) NOT NULL,
    batch_no TEXT NOT NULL,
    vaccine_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    priority INTEGER NOT NULL DEFAULT 5 CHECK(priority BETWEEN 1 AND 10),
    reason TEXT NOT NULL,
    operator_id TEXT REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'quarantined' CHECK(status IN ('quarantined', 'pending_review', 'released', 'recalled', 'destroyed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_records (
    id TEXT PRIMARY KEY,
    quarantine_id TEXT REFERENCES quarantine_records(id) NOT NULL,
    deviation_id TEXT REFERENCES temperature_deviations(id),
    reviewer_id TEXT REFERENCES users(id),
    review_opinion TEXT NOT NULL,
    review_result TEXT NOT NULL CHECK(review_result IN ('release', 'recall', 'destroy', 'pending')),
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recall_records (
    id TEXT PRIMARY KEY,
    recall_no TEXT UNIQUE NOT NULL,
    batch_id TEXT REFERENCES vaccine_batches(id) NOT NULL,
    batch_no TEXT NOT NULL,
    vaccine_name TEXT NOT NULL,
    total_quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    initiator_id TEXT REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'notified' CHECK(status IN ('notified', 'in_progress', 'completed', 'cancelled')),
    vaccination_sites TEXT,
    notified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vaccination_sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    manager_name TEXT,
    manager_phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_inventories (
    id TEXT PRIMARY KEY,
    site_id TEXT REFERENCES vaccination_sites(id) NOT NULL,
    batch_id TEXT REFERENCES vaccine_batches(id) NOT NULL,
    batch_no TEXT NOT NULL,
    vaccine_name TEXT NOT NULL,
    expected_quantity INTEGER NOT NULL,
    actual_quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal', 'mismatch', 'reconciled')),
    last_checked DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(site_id, batch_id)
);

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_temp_records_device ON temperature_records(device_type, device_id, recorded_at);
CREATE INDEX idx_temp_records_normal ON temperature_records(is_normal, recorded_at);
CREATE INDEX idx_deviations_status ON temperature_deviations(status, created_at);
CREATE INDEX idx_deviations_risk ON temperature_deviations(risk_level, created_at);
CREATE INDEX idx_quarantine_status ON quarantine_records(status, priority);
CREATE INDEX idx_quarantine_batch ON quarantine_records(batch_id);
CREATE INDEX idx_recall_status ON recall_records(status, created_at);
CREATE INDEX idx_inventory_site ON site_inventories(site_id, status);
