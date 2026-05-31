use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, QuarantineRecord};

#[get("/api/quarantine-records?<status>&<batch_no>")]
pub async fn get_all(
    pool: &State<SqlitePool>,
    status: Option<String>,
    batch_no: Option<String>,
) -> Json<ApiResponse<Vec<QuarantineRecord>>> {
    let mut query = r#"SELECT id, deviation_id, batch_id, batch_no, vaccine_name, quantity, priority, reason, operator_id, status, created_at as "created_at: _" FROM quarantine_records WHERE 1=1"#.to_string();
    let mut params: Vec<String> = Vec::new();

    if let Some(s) = status {
        query.push_str(" AND status = ?");
        params.push(s);
    }
    if let Some(b) = batch_no {
        query.push_str(" AND batch_no LIKE ?");
        params.push(format!("%{}%", b));
    }
    
    query.push_str(" ORDER BY priority DESC, created_at DESC");

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

#[post("/api/quarantine-records", data = "<data>")]
pub async fn create(pool: &State<SqlitePool>, data: Json<QuarantineRecord>) -> Json<ApiResponse<QuarantineRecord>> {
    let id = Uuid::new_v4().to_string();
    
    let result = sqlx::query!(
        r#"INSERT INTO quarantine_records (id, deviation_id, batch_id, batch_no, vaccine_name, quantity, priority, reason, operator_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        id,
        data.deviation_id,
        data.batch_id,
        data.batch_no,
        data.vaccine_name,
        data.quantity,
        data.priority,
        data.reason,
        data.operator_id,
        "quarantined"
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            sqlx::query!(
                r#"UPDATE vaccine_batches SET status = 'quarantined' WHERE id = ?"#,
                data.batch_id
            )
            .execute(pool.inner())
            .await
            .ok();

            let item = sqlx::query_as!(
                QuarantineRecord,
                r#"SELECT id, deviation_id, batch_id, batch_no, vaccine_name, quantity, priority, reason, operator_id, status, created_at as "created_at: _" FROM quarantine_records WHERE id = ?"#,
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

#[put("/api/quarantine-records/<id>/priority", data = "<data>")]
pub async fn update_priority(
    pool: &State<SqlitePool>,
    id: String,
    data: Json<serde_json::Value>,
) -> Json<ApiResponse<QuarantineRecord>> {
    let priority = data["priority"].as_i64().unwrap_or(5) as i32;
    
    let result = sqlx::query!(
        r#"UPDATE quarantine_records SET priority = ? WHERE id = ?"#,
        priority,
        id
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                QuarantineRecord,
                r#"SELECT id, deviation_id, batch_id, batch_no, vaccine_name, quantity, priority, reason, operator_id, status, created_at as "created_at: _" FROM quarantine_records WHERE id = ?"#,
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

#[put("/api/quarantine-records/<id>/submit-review")]
pub async fn submit_for_review(pool: &State<SqlitePool>, id: String) -> Json<ApiResponse<QuarantineRecord>> {
    let result = sqlx::query!(
        r#"UPDATE quarantine_records SET status = 'pending_review' WHERE id = ?"#,
        id
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                QuarantineRecord,
                r#"SELECT id, deviation_id, batch_id, batch_no, vaccine_name, quantity, priority, reason, operator_id, status, created_at as "created_at: _" FROM quarantine_records WHERE id = ?"#,
                id
            )
            .fetch_one(pool.inner())
            .await
            .unwrap();
            
            Json(ApiResponse::success(item))
        }
        Err(e) => Json(ApiResponse::error(format!("提交失败: {}", e))),
    }
}
