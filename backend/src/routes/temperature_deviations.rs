use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, TemperatureDeviation, RiskLaneGroup};

#[get("/api/temperature-deviations?<status>&<risk_level>&<device_type>")]
pub async fn get_all(
    pool: &State<SqlitePool>,
    status: Option<String>,
    risk_level: Option<String>,
    device_type: Option<String>,
) -> Json<ApiResponse<Vec<TemperatureDeviation>>> {
    let mut query = r#"SELECT id, device_type, device_id, device_name, deviation_type, start_time as "start_time: _", end_time as "end_time: _", duration_minutes, max_temp, min_temp, avg_temp, affected_batches, risk_level, status, handler_id, description, created_at as "created_at: _" FROM temperature_deviations WHERE 1=1"#.to_string();
    let mut params: Vec<String> = Vec::new();

    if let Some(s) = status {
        query.push_str(" AND status = ?");
        params.push(s);
    }
    if let Some(r) = risk_level {
        query.push_str(" AND risk_level = ?");
        params.push(r);
    }
    if let Some(d) = device_type {
        query.push_str(" AND device_type = ?");
        params.push(d);
    }
    
    query.push_str(" ORDER BY created_at DESC");

    let mut query_builder = sqlx::query_as(&query);
    for param in &params {
        query_builder = query_builder.bind(param);
    }

    let result = query_builder.fetch_all(pool.inner()).await;

    match result {
        Ok(items) => Json(ApiResponse::success(items)),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[get("/api/temperature-deviations/risk-lanes")]
pub async fn get_risk_lanes(pool: &State<SqlitePool>) -> Json<ApiResponse<Vec<RiskLaneGroup>>> {
    let deviations = sqlx::query_as!(
        TemperatureDeviation,
        r#"SELECT id, device_type, device_id, device_name, deviation_type, start_time as "start_time: _", end_time as "end_time: _", duration_minutes, max_temp, min_temp, avg_temp, affected_batches, risk_level, status, handler_id, description, created_at as "created_at: _" FROM temperature_deviations WHERE status IN ('detected', 'processing') ORDER BY duration_minutes DESC"#
    )
    .fetch_all(pool.inner())
    .await
    .unwrap_or_default();

    let mut lanes = vec![
        RiskLaneGroup { temp_zone: "严重超温 (>25°C)".to_string(), duration_range: "持续超120分钟".to_string(), items: Vec::new() },
        RiskLaneGroup { temp_zone: "中度超温 (15-25°C)".to_string(), duration_range: "持续60-120分钟".to_string(), items: Vec::new() },
        RiskLaneGroup { temp_zone: "轻度超温 (8-15°C)".to_string(), duration_range: "持续30-60分钟".to_string(), items: Vec::new() },
        RiskLaneGroup { temp_zone: "低温异常 (<2°C)".to_string(), duration_range: "任意时长".to_string(), items: Vec::new() },
    ];

    for d in deviations {
        let lane_idx = match (d.risk_level.as_str(), d.duration_minutes) {
            ("critical", _) => 0,
            ("high", m) if m >= 120 => 0,
            ("high", _) => 1,
            ("medium", m) if m >= 60 => 1,
            ("medium", _) => 2,
            ("low", _) => 3,
            _ => 2,
        };
        if lane_idx < lanes.len() {
            lanes[lane_idx].items.push(d);
        }
    }

    Json(ApiResponse::success(lanes))
}

#[get("/api/temperature-deviations/<id>")]
pub async fn get_by_id(pool: &State<SqlitePool>, id: String) -> Json<ApiResponse<TemperatureDeviation>> {
    let result = sqlx::query_as!(
        TemperatureDeviation,
        r#"SELECT id, device_type, device_id, device_name, deviation_type, start_time as "start_time: _", end_time as "end_time: _", duration_minutes, max_temp, min_temp, avg_temp, affected_batches, risk_level, status, handler_id, description, created_at as "created_at: _" FROM temperature_deviations WHERE id = ?"#,
        id
    )
    .fetch_optional(pool.inner())
    .await;

    match result {
        Ok(Some(item)) => Json(ApiResponse::success(item)),
        Ok(None) => Json(ApiResponse::error("偏差记录不存在".to_string())),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[post("/api/temperature-deviations", data = "<data>")]
pub async fn create(pool: &State<SqlitePool>, data: Json<TemperatureDeviation>) -> Json<ApiResponse<TemperatureDeviation>> {
    let id = Uuid::new_v4().to_string();
    
    let result = sqlx::query!(
        r#"INSERT INTO temperature_deviations (id, device_type, device_id, device_name, deviation_type, start_time, duration_minutes, max_temp, min_temp, avg_temp, affected_batches, risk_level, status, handler_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        id,
        data.device_type,
        data.device_id,
        data.device_name,
        data.deviation_type,
        data.start_time,
        data.duration_minutes,
        data.max_temp,
        data.min_temp,
        data.avg_temp,
        data.affected_batches,
        data.risk_level,
        "detected",
        data.handler_id,
        data.description
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                TemperatureDeviation,
                r#"SELECT id, device_type, device_id, device_name, deviation_type, start_time as "start_time: _", end_time as "end_time: _", duration_minutes, max_temp, min_temp, avg_temp, affected_batches, risk_level, status, handler_id, description, created_at as "created_at: _" FROM temperature_deviations WHERE id = ?"#,
                id
            )
            .fetch_one(pool.inner())
            .await
            .unwrap();
            
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(format!("创建失败: {}", e))),
    }
}

#[put("/api/temperature-deviations/<id>/status", data = "<status_data>")]
pub async fn update_status(
    pool: &State<SqlitePool>,
    id: String,
    status_data: Json<serde_json::Value>,
) -> Json<ApiResponse<TemperatureDeviation>> {
    let new_status = status_data["status"].as_str().unwrap_or("processing");
    let handler_id = status_data["handler_id"].as_str();
    
    let result = sqlx::query!(
        r#"UPDATE temperature_deviations SET status = ?, handler_id = COALESCE(?, handler_id) WHERE id = ?"#,
        new_status,
        handler_id,
        id
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                TemperatureDeviation,
                r#"SELECT id, device_type, device_id, device_name, deviation_type, start_time as "start_time: _", end_time as "end_time: _", duration_minutes, max_temp, min_temp, avg_temp, affected_batches, risk_level, status, handler_id, description, created_at as "created_at: _" FROM temperature_deviations WHERE id = ?"#,
                id
            )
            .fetch_one(pool.inner())
            .await
            .unwrap();
            
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(format!("更新失败: {}", e))),
    }
}
