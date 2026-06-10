CREATE TABLE IF NOT EXISTS Campus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Classroom (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    campusId INTEGER NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    FOREIGN KEY (campusId) REFERENCES Campus(id)
);

CREATE TABLE IF NOT EXISTS Equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    classroomId INTEGER NOT NULL,
    status TEXT DEFAULT 'AVAILABLE',
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (classroomId) REFERENCES Classroom(id)
);

CREATE TABLE IF NOT EXISTS BorrowApplication (
    id TEXT PRIMARY KEY,
    classroomId INTEGER NOT NULL,
    applicantName TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (classroomId) REFERENCES Classroom(id)
);

CREATE TABLE IF NOT EXISTS EquipmentHandover (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicationId TEXT NOT NULL,
    equipmentName TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    handoverTime TEXT NOT NULL,
    handlerName TEXT NOT NULL,
    FOREIGN KEY (applicationId) REFERENCES BorrowApplication(id)
);

CREATE TABLE IF NOT EXISTS ReturnVerification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicationId TEXT UNIQUE NOT NULL,
    cleaningStatus TEXT DEFAULT 'PENDING',
    cleaningPhoto TEXT,
    abnormalReason TEXT,
    verifierName TEXT NOT NULL,
    verifiedAt TEXT NOT NULL,
    FOREIGN KEY (applicationId) REFERENCES BorrowApplication(id)
);

CREATE TABLE IF NOT EXISTS ApplicationHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicationId TEXT NOT NULL,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    FOREIGN KEY (applicationId) REFERENCES BorrowApplication(id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_campus ON Classroom(campusId);
CREATE INDEX IF NOT EXISTS idx_equipment_classroom ON Equipment(classroomId);
CREATE INDEX IF NOT EXISTS idx_application_classroom ON BorrowApplication(classroomId);
CREATE INDEX IF NOT EXISTS idx_application_status ON BorrowApplication(status);
CREATE INDEX IF NOT EXISTS idx_handover_application ON EquipmentHandover(applicationId);
CREATE INDEX IF NOT EXISTS idx_verification_application ON ReturnVerification(applicationId);
CREATE INDEX IF NOT EXISTS idx_history_application ON ApplicationHistory(applicationId);
