CREATE TABLE recall_site_notifications (
    id TEXT PRIMARY KEY,
    recall_id TEXT REFERENCES recall_records(id) NOT NULL,
    site_id TEXT REFERENCES vaccination_sites(id) NOT NULL,
    site_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    notified BOOLEAN NOT NULL DEFAULT 0,
    notified_at DATETIME,
    confirmed BOOLEAN NOT NULL DEFAULT 0,
    confirmed_at DATETIME,
    returned_quantity INTEGER DEFAULT 0,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(recall_id, site_id)
);

CREATE INDEX idx_recall_notifications_recall ON recall_site_notifications(recall_id);
CREATE INDEX idx_recall_notifications_site ON recall_site_notifications(site_id);
