<?php

define('ROOT_PATH', dirname(__DIR__));

try {
    $dbPath = ROOT_PATH . '/database/database.sqlite';
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $pdo->exec("PRAGMA foreign_keys = ON;");
    
    $migrations = [
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'farmer',
            phone VARCHAR(20),
            address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        
        "CREATE TABLE IF NOT EXISTS fields (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            farmer_id INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            area DECIMAL(10,2) NOT NULL,
            crop_type VARCHAR(100),
            soil_type VARCHAR(100),
            status VARCHAR(50) DEFAULT 'active',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (farmer_id) REFERENCES users(id)
        )",
        
        "CREATE TABLE IF NOT EXISTS machines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(100) NOT NULL,
            model VARCHAR(100),
            plate_number VARCHAR(50),
            operator_id INTEGER,
            fuel_consumption DECIMAL(8,2),
            status VARCHAR(50) DEFAULT 'available',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (operator_id) REFERENCES users(id)
        )",
        
        "CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_no VARCHAR(50) UNIQUE NOT NULL,
            farmer_id INTEGER NOT NULL,
            field_id INTEGER NOT NULL,
            operation_type VARCHAR(100) NOT NULL,
            requested_date DATE NOT NULL,
            area DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            priority VARCHAR(50) DEFAULT 'normal',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (farmer_id) REFERENCES users(id),
            FOREIGN KEY (field_id) REFERENCES fields(id)
        )",
        
        "CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            machine_id INTEGER NOT NULL,
            operator_id INTEGER NOT NULL,
            scheduled_date DATE NOT NULL,
            start_time TIME,
            end_time TIME,
            status VARCHAR(50) DEFAULT 'scheduled',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id),
            FOREIGN KEY (machine_id) REFERENCES machines(id),
            FOREIGN KEY (operator_id) REFERENCES users(id)
        )",
        
        "CREATE TABLE IF NOT EXISTS job_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule_id INTEGER NOT NULL,
            checkin_time DATETIME,
            checkout_time DATETIME,
            actual_area DECIMAL(10,2),
            fuel_used DECIMAL(8,2),
            quality_rating INTEGER,
            status VARCHAR(50) DEFAULT 'in_progress',
            inspector_id INTEGER,
            inspection_notes TEXT,
            inspected_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (schedule_id) REFERENCES schedules(id),
            FOREIGN KEY (inspector_id) REFERENCES users(id)
        )",
        
        "CREATE TABLE IF NOT EXISTS subsidies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            subsidy_no VARCHAR(50) UNIQUE NOT NULL,
            job_record_id INTEGER NOT NULL,
            operation_type VARCHAR(100),
            area DECIMAL(10,2),
            fuel_subsidy_rate DECIMAL(10,2),
            fuel_subsidy_amount DECIMAL(12,2),
            operation_subsidy_rate DECIMAL(10,2),
            operation_subsidy_amount DECIMAL(12,2),
            total_subsidy DECIMAL(12,2),
            status VARCHAR(50) DEFAULT 'pending',
            approved_by INTEGER,
            approved_at DATETIME,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (job_record_id) REFERENCES job_records(id),
            FOREIGN KEY (approved_by) REFERENCES users(id)
        )",
        
        "CREATE TABLE IF NOT EXISTS settlements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            settlement_no VARCHAR(50) UNIQUE NOT NULL,
            farmer_id INTEGER NOT NULL,
            subsidy_id INTEGER,
            operation_fee DECIMAL(12,2),
            fuel_cost DECIMAL(12,2),
            subsidy_amount DECIMAL(12,2),
            total_amount DECIMAL(12,2),
            status VARCHAR(50) DEFAULT 'unpaid',
            paid_at DATETIME,
            payment_method VARCHAR(50),
            transaction_no VARCHAR(255),
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (farmer_id) REFERENCES users(id),
            FOREIGN KEY (subsidy_id) REFERENCES subsidies(id)
        )",
        
        "CREATE TABLE IF NOT EXISTS exceptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exception_no VARCHAR(50) UNIQUE NOT NULL,
            schedule_id INTEGER,
            job_record_id INTEGER,
            reporter_id INTEGER NOT NULL,
            type VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'open',
            handler_id INTEGER,
            resolution TEXT,
            resolved_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (schedule_id) REFERENCES schedules(id),
            FOREIGN KEY (job_record_id) REFERENCES job_records(id),
            FOREIGN KEY (reporter_id) REFERENCES users(id),
            FOREIGN KEY (handler_id) REFERENCES users(id)
        )",
    ];
    
    foreach ($migrations as $sql) {
        $pdo->exec($sql);
    }
    
    echo "数据库表创建成功！\n";
    
    $seedSql = file_get_contents(ROOT_PATH . '/database/seeders/seed.sql');
    if ($seedSql) {
        $pdo->exec($seedSql);
        echo "示例数据导入成功！\n";
    }
    
} catch (Exception $e) {
    echo "错误: " . $e->getMessage() . "\n";
}
