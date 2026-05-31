use rocket::{serde::json::Json, serde::{Serialize, Deserialize}, State};
use sqlx::{SqlitePool, FromRow};
use crate::models::{ApiResponse, TraceReport, TemperatureRecord, QuarantineRecord, RecallRecord};

#[get("/api/trace/<batch_id>")]
pub async fn get_trace_report(pool: &State<SqlitePool>, batch_id: String) -> Json<ApiResponse<TraceReport>> {
    let batch = sqlx::query!(
        r#"SELECT batch_no, vaccine_name FROM vaccine_batches WHERE id = ?"#,
        batch_id
    )
    .fetch_optional(pool.inner())
    .await;

    let batch = match batch {
        Ok(Some(b)) => b,
        Ok(None) => return Json(ApiResponse::error("批次不存在".to_string())),
        Err(e) => return Json(ApiResponse::error(format!("数据库错误: {}", e))),
    };

    let temperature_history = sqlx::query_as!(
        TemperatureRecord,
        r#"SELECT id, device_type, device_id, temperature, recorded_at as "recorded_at: _", is_normal FROM temperature_records WHERE device_id IN (SELECT storage_location_id FROM vaccine_batches WHERE id = ?) ORDER BY recorded_at DESC LIMIT 100"#,
        batch_id
    )
    .fetch_all(pool.inner())
    .await
    .unwrap_or_default();

    let deviation_count: i64 = sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(*) FROM temperature_deviations WHERE affected_batches LIKE ?"#,
        format!("%{}%", batch_id)
    )
    .fetch_one(pool.inner())
    .await
    .unwrap_or(0);

    let quarantine_events = sqlx::query_as!(
        QuarantineRecord,
        r#"SELECT id, deviation_id, batch_id, batch_no, vaccine_name, quantity, priority, reason, operator_id, status, created_at as "created_at: _" FROM quarantine_records WHERE batch_id = ? ORDER BY created_at DESC"#,
        batch_id
    )
    .fetch_all(pool.inner())
    .await
    .unwrap_or_default();

    let recall_events = sqlx::query_as!(
        RecallRecord,
        r#"SELECT id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites, notified_at as "notified_at: _", completed_at as "completed_at: _", created_at as "created_at: _" FROM recall_records WHERE batch_id = ? ORDER BY created_at DESC"#,
        batch_id
    )
    .fetch_all(pool.inner())
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(TraceReport {
        batch_id: batch_id.clone(),
        batch_no: batch.batch_no,
        vaccine_name: batch.vaccine_name,
        temperature_history,
        deviation_count,
        quarantine_events,
        recall_events,
    }))
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
struct TraceReportItem {
    pub id: String,
    pub batch_no: String,
    pub vaccine_name: String,
    pub manufacturer: String,
    pub status: String,
    pub quarantine_count: i64,
    pub recall_count: i64,
}

#[get("/api/trace/reports?<date_from>&<date_to>&<vaccine_name>")]
pub async fn get_trace_reports(
    pool: &State<SqlitePool>,
    date_from: Option<String>,
    date_to: Option<String>,
    vaccine_name: Option<String>,
) -> Json<ApiResponse<Vec<TraceReportItem>>> {
    let mut query = r#"
        SELECT 
            b.id,
            b.batch_no,
            b.vaccine_name,
            b.manufacturer,
            b.status,
            COUNT(DISTINCT q.id) as quarantine_count,
            COUNT(DISTINCT r.id) as recall_count
        FROM vaccine_batches b
        LEFT JOIN quarantine_records q ON q.batch_id = b.id
        LEFT JOIN recall_records r ON r.batch_id = b.id
        WHERE 1=1
    "#.to_string();
    let mut params: Vec<String> = Vec::new();

    if let Some(_df) = date_from {
        query.push_str(" AND b.created_at >= ?");
        params.push(_df);
    }
    if let Some(_dt) = date_to {
        query.push_str(" AND b.created_at <= ?");
        params.push(_dt);
    }
    if let Some(vn) = vaccine_name {
        query.push_str(" AND b.vaccine_name LIKE ?");
        params.push(format!("%{}%", vn));
    }
    
    query.push_str(" GROUP BY b.id ORDER BY b.created_at DESC");

    let mut query_builder = sqlx::query_as::<_, TraceReportItem>(&query);
    for param in &params {
        query_builder = query_builder.bind(param);
    }

    let rows = query_builder.fetch_all(pool.inner()).await;
    
    match rows {
        Ok(records) => Json(ApiResponse::success(records)),
        Err(e) => Json(ApiResponse::error(format!("查询失败: {}", e))),
    }
}
