use sqlx::SqlitePool;
use uuid::Uuid;
use chrono::{Utc, NaiveDate};

mod db;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();
    
    let pool = db::establish_connection().await?;

    println!("开始插入seed数据...");

    seed_users(&pool).await?;
    seed_cold_storages(&pool).await?;
    seed_transport_boxes(&pool).await?;
    seed_vaccination_sites(&pool).await?;
    seed_vaccine_batches(&pool).await?;
    seed_temperature_records(&pool).await?;
    seed_temperature_deviations(&pool).await?;
    seed_quarantine_records(&pool).await?;
    seed_recall_records(&pool).await?;
    seed_site_inventories(&pool).await?;

    println!("Seed数据插入完成!");
    Ok(())
}

async fn seed_users(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    println!("插入用户数据...");
    
    let users = vec![
        (Uuid::new_v4().to_string(), "cold_admin", "张冷链", "cold_chain_admin", Some("13800138001")),
        (Uuid::new_v4().to_string(), "cdc_reviewer", "李疾控", "cdc_reviewer", Some("13800138002")),
        (Uuid::new_v4().to_string(), "site_manager", "王接种", "vaccination_site_manager", Some("13800138003")),
    ];

    for (id, username, real_name, role, phone) in users {
        sqlx::query!(
            "INSERT OR IGNORE INTO users (id, username, real_name, role, phone) VALUES (?, ?, ?, ?, ?)",
            id, username, real_name, role, phone
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn seed_cold_storages(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    println!("插入冷库数据...");
    
    let storages = vec![
        (Uuid::new_v4().to_string(), "县疾控中心冷库A", "CS-001", "县疾控中心大院1号楼", 5000, 2.0, 8.0, "normal"),
        (Uuid::new_v4().to_string(), "县疾控中心冷库B", "CS-002", "县疾控中心大院2号楼", 3000, 2.0, 8.0, "normal"),
        (Uuid::new_v4().to_string(), "备用冷库", "CS-003", "县疾控中心后院", 2000, 2.0, 8.0, "maintenance"),
    ];

    for (id, name, code, location, capacity, min_temp, max_temp, status) in storages {
        sqlx::query!(
            "INSERT OR IGNORE INTO cold_storages (id, name, code, location, capacity, min_temp, max_temp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            id, name, code, location, capacity, min_temp, max_temp, status
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn seed_transport_boxes(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    println!("插入转运箱数据...");
    
    let boxes = vec![
        (Uuid::new_v4().to_string(), "冷藏转运箱A01", "TB-A01", Some("RC-2024"), 500, 2.0, 8.0, Some("县疾控中心"), "idle"),
        (Uuid::new_v4().to_string(), "冷藏转运箱A02", "TB-A02", Some("RC-2024"), 500, 2.0, 8.0, Some("运往城东接种点"), "in_transit"),
        (Uuid::new_v4().to_string(), "冷藏转运箱B01", "TB-B01", Some("RC-2023"), 300, 2.0, 8.0, None, "maintenance"),
    ];

    for (id, name, code, model, capacity, min_temp, max_temp, location, status) in boxes {
        sqlx::query!(
            "INSERT OR IGNORE INTO transport_boxes (id, name, code, model, capacity, min_temp, max_temp, current_location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            id, name, code, model, capacity, min_temp, max_temp, location, status
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn seed_vaccination_sites(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    println!("插入接种点数据...");
    
    let sites = vec![
        (Uuid::new_v4().to_string(), "城关镇卫生院接种点", "VS-001", "县城关镇卫生院门诊楼", Some("刘医生"), Some("13900139001"), "active"),
        (Uuid::new_v4().to_string(), "城东社区卫生服务中心", "VS-002", "县城东新区卫生服务大楼", Some("陈医生"), Some("13900139002"), "active"),
        (Uuid::new_v4().to_string(), "城郊乡卫生院接种点", "VS-003", "城郊乡政府旁卫生院", Some("周医生"), Some("13900139003"), "active"),
    ];

    for (id, name, code, address, manager_name, manager_phone, status) in sites {
        sqlx::query!(
            "INSERT OR IGNORE INTO vaccination_sites (id, name, code, address, manager_name, manager_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            id, name, code, address, manager_name, manager_phone, status
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn seed_vaccine_batches(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    println!("插入疫苗批次数据...");
    
    let cold_storage = sqlx::query_scalar!("SELECT id FROM cold_storages WHERE code = 'CS-001'")
        .fetch_one(pool)
        .await?;

    let batches = vec![
        (Uuid::new_v4().to_string(), "CV-2024-001", "新冠疫苗(Vero细胞)", "国药中生", NaiveDate::from_ymd_opt(2024, 1, 15).unwrap(), NaiveDate::from_ymd_opt(2025, 7, 15).unwrap(), 1000, 1000, "cold_storage", cold_storage.clone(), None, "normal"),
        (Uuid::new_v4().to_string(), "CV-2024-002", "新冠疫苗(Vero细胞)", "北京科兴", NaiveDate::from_ymd_opt(2024, 2, 20).unwrap(), NaiveDate::from_ymd_opt(2025, 8, 20).unwrap(), 800, 750, "cold_storage", cold_storage.clone(), None, "normal"),
        (Uuid::new_v4().to_string(), "FLU-2024-A01", "流感疫苗", "华兰生物", NaiveDate::from_ymd_opt(2024, 8, 1).unwrap(), NaiveDate::from_ymd_opt(2025, 6, 30).unwrap(), 500, 480, "cold_storage", cold_storage.clone(), None, "quarantined"),
        (Uuid::new_v4().to_string(), "HEP-A-2024-001", "甲肝疫苗", "康泰生物", NaiveDate::from_ymd_opt(2023, 12, 1).unwrap(), NaiveDate::from_ymd_opt(2025, 12, 1).unwrap(), 600, 550, "cold_storage", cold_storage.clone(), None, "normal"),
        (Uuid::new_v4().to_string(), "MMR-2024-001", "麻腮风疫苗", "默沙东", NaiveDate::from_ymd_opt(2024, 3, 15).unwrap(), NaiveDate::from_ymd_opt(2025, 9, 15).unwrap(), 400, 300, "cold_storage", cold_storage, None, "recalled"),
    ];

    for (id, batch_no, vaccine_name, manufacturer, production_date, expiry_date, total_quantity, available_quantity, storage_location_type, storage_location_id, current_location, status) in batches {
        sqlx::query!(
            "INSERT OR IGNORE INTO vaccine_batches (id, batch_no, vaccine_name, manufacturer, production_date, expiry_date, total_quantity, available_quantity, storage_location_type, storage_location_id, current_location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            id, batch_no, vaccine_name, manufacturer, production_date, expiry_date, total_quantity, available_quantity, storage_location_type, storage_location_id, current_location, status
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn seed_temperature_records(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    println!("插入温度记录数据...");
    
    let cold_storage = sqlx::query_scalar!("SELECT id FROM cold_storages WHERE code = 'CS-001'")
        .fetch_one(pool)
        .await?;

    let now = Utc::now();
    for i in 0..50 {
        let temp = if i < 5 { 12.5 } else { 5.0 + (i as f64 * 0.1) % 3.0 };
        let is_normal = temp >= 2.0 && temp <= 8.0;
        let recorded_at = now - chrono::Duration::minutes(i * 30);
        
        sqlx::query!(
            "INSERT INTO temperature_records (id, device_type, device_id, temperature, recorded_at, is_normal) VALUES (?, ?, ?, ?, ?, ?)",
            Uuid::new_v4().to_string(),
            "cold_storage",
            cold_storage,
            temp,
            recorded_at,
            is_normal
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn seed_temperature_deviations(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    println!("插入温控偏差数据...");
    
    let cold_storage_id = sqlx::query_scalar!("SELECT id FROM cold_storages WHERE code = 'CS-001'")
        .fetch_one(pool)
        .await?;
    let transport_box_id = sqlx::query_scalar!("SELECT id FROM transport_boxes WHERE code = 'TB-A02'")
        .fetch_one(pool)
        .await?;

    let now = Utc::now();
    
    let deviations = vec![
        (
            Uuid::new_v4().to_string(),
            "cold_storage",
            cold_storage_id.clone(),
            "县疾控中心冷库A",
            "over_temp",
            now - chrono::Duration::hours(3),
            Some(now - chrono::Duration::hours(1)),
            125,
            Some(28.5),
            Some(22.0),
            Some(25.2),
            Some("CV-2024-001,FLU-2024-A01"),
            "critical",
            "processing",
            None::<String>,
            Some("冷库压缩机故障导致超温125分钟".to_string()),
        ),
        (
            Uuid::new_v4().to_string(),
            "transport_box",
            transport_box_id.clone(),
            "冷藏转运箱A02",
            "over_temp",
            now - chrono::Duration::hours(2),
            None,
            90,
            Some(18.2),
            Some(14.5),
            Some(16.3),
            Some("CV-2024-002"),
            "high",
            "detected",
            None::<String>,
            Some("转运途中温度异常升高".to_string()),
        ),
        (
            Uuid::new_v4().to_string(),
            "cold_storage",
            cold_storage_id.clone(),
            "县疾控中心冷库A",
            "fluctuation",
            now - chrono::Duration::hours(8),
            Some(now - chrono::Duration::hours(6)),
            45,
            Some(9.5),
            Some(3.2),
            Some(6.0),
            None,
            "medium",
            "resolved",
            None::<String>,
            Some("温度波动范围较大".to_string()),
        ),
        (
            Uuid::new_v4().to_string(),
            "cold_storage",
            cold_storage_id,
            "县疾控中心冷库A",
            "under_temp",
            now - chrono::Duration::hours(24),
            Some(now - chrono::Duration::hours(23)),
            15,
            Some(1.0),
            Some(-0.5),
            Some(0.3),
            None,
            "low",
            "closed",
            None::<String>,
            Some("短暂低温".to_string()),
        ),
    ];

    for (id, device_type, device_id, device_name, deviation_type, start_time, end_time, duration, max_temp, min_temp, avg_temp, affected_batches, risk_level, status, handler_id, description) in deviations {
        sqlx::query!(
            "INSERT INTO temperature_deviations (id, device_type, device_id, device_name, deviation_type, start_time, end_time, duration_minutes, max_temp, min_temp, avg_temp, affected_batches, risk_level, status, handler_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            id, device_type, device_id, device_name, deviation_type, start_time, end_time, duration, max_temp, min_temp, avg_temp, affected_batches, risk_level, status, handler_id, description
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn seed_quarantine_records(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    println!("插入批次隔离数据...");
    
    let batch1 = sqlx::query!("SELECT id, batch_no, vaccine_name FROM vaccine_batches WHERE batch_no = 'FLU-2024-A01'")
        .fetch_one(pool)
        .await?;
    let batch2 = sqlx::query!("SELECT id, batch_no, vaccine_name FROM vaccine_batches WHERE batch_no = 'CV-2024-002'")
        .fetch_one(pool)
        .await?;

    let quarantines = vec![
        (Uuid::new_v4().to_string(), None, batch1.id, batch1.batch_no, batch1.vaccine_name, 500, 10, "严重超温超过2小时，高优先级处理", None, "quarantined"),
        (Uuid::new_v4().to_string(), None, batch2.id, batch2.batch_no, batch2.vaccine_name, 50, 7, "转运途中温度升高", None, "pending_review"),
    ];

    for (id, deviation_id, batch_id, batch_no, vaccine_name, quantity, priority, reason, operator_id, status) in quarantines {
        sqlx::query!(
            "INSERT INTO quarantine_records (id, deviation_id, batch_id, batch_no, vaccine_name, quantity, priority, reason, operator_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            id, deviation_id, batch_id, batch_no, vaccine_name, quantity, priority, reason, operator_id, status
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn seed_recall_records(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    println!("插入召回记录数据...");
    
    let batch = sqlx::query!("SELECT id, batch_no, vaccine_name FROM vaccine_batches WHERE batch_no = 'MMR-2024-001'")
        .fetch_one(pool)
        .await?;
    let site1 = sqlx::query_scalar!("SELECT id FROM vaccination_sites WHERE code = 'VS-001'")
        .fetch_one(pool)
        .await?;
    let site2 = sqlx::query_scalar!("SELECT id FROM vaccination_sites WHERE code = 'VS-002'")
        .fetch_one(pool)
        .await?;

    let recalls = vec![
        (Uuid::new_v4().to_string(), "RC-2024-0001", batch.id, batch.batch_no, batch.vaccine_name, 100, "温控偏差存在质量风险，需全部召回", None, "in_progress", Some(format!("{},{}", site1, site2))),
    ];

    for (id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites) in recalls {
        sqlx::query!(
            "INSERT INTO recall_records (id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}

async fn seed_site_inventories(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    println!("插入接种点库存数据...");
    
    let site = sqlx::query_scalar!("SELECT id FROM vaccination_sites WHERE code = 'VS-001'")
        .fetch_one(pool)
        .await?;
    let batch = sqlx::query!("SELECT id, batch_no, vaccine_name FROM vaccine_batches WHERE batch_no = 'CV-2024-001'")
        .fetch_one(pool)
        .await?;

    let inventories = vec![
        (Uuid::new_v4().to_string(), site.clone(), batch.id, batch.batch_no, batch.vaccine_name, 200, 185, "mismatch"),
        (Uuid::new_v4().to_string(), site, batch.id, "CV-2024-002".to_string(), "新冠疫苗(Vero细胞)".to_string(), 150, 150, "normal"),
    ];

    for (id, site_id, batch_id, batch_no, vaccine_name, expected_quantity, actual_quantity, status) in inventories {
        sqlx::query!(
            "INSERT OR IGNORE INTO site_inventories (id, site_id, batch_id, batch_no, vaccine_name, expected_quantity, actual_quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            id, site_id, batch_id, batch_no, vaccine_name, expected_quantity, actual_quantity, status
        )
        .execute(pool)
        .await?;
    }
    Ok(())
}
