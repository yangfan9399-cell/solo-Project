use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, RecallRecord};

#[get("/api/recall-records?<status>")]
pub async fn get_all(
    pool: &State<SqlitePool>,
    status: Option<String>,
) -> Json<ApiResponse<Vec<RecallRecord>>> {
    let mut query = r#"SELECT id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites, notified_at as "notified_at: _", completed_at as "completed_at: _", created_at as "created_at: _" FROM recall_records WHERE 1=1"#.to_string();
    let mut params: Vec<String> = Vec::new();

    if let Some(s) = status {
        query.push_str(" AND status = ?");
        params.push(s);
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

#[post("/api/recall-records", data = "<data>")]
pub async fn create(pool: &State<SqlitePool>, data: Json<RecallRecord>) -> Json<ApiResponse<RecallRecord>> {
    let id = Uuid::new_v4().to_string();
    let recall_no = format!("RC{:08}", chrono::Utc::now().timestamp());
    
    let result = sqlx::query!(
        r#"INSERT INTO recall_records (id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        id,
        recall_no,
        data.batch_id,
        data.batch_no,
        data.vaccine_name,
        data.total_quantity,
        data.reason,
        data.initiator_id,
        "notified",
        data.vaccination_sites
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                RecallRecord,
                r#"SELECT id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites, notified_at as "notified_at: _", completed_at as "completed_at: _", created_at as "created_at: _" FROM recall_records WHERE id = ?"#,
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

#[put("/api/recall-records/<id>/status", data = "<data>")]
pub async fn update_status(
    pool: &State<SqlitePool>,
    id: String,
    data: Json<serde_json::Value>,
) -> Json<ApiResponse<RecallRecord>> {
    let new_status = data["status"].as_str().unwrap_or("in_progress");
    
    let result = if new_status == "completed" {
        sqlx::query!(
            r#"UPDATE recall_records SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?"#,
            new_status,
            id
        )
        .execute(pool.inner())
        .await
    } else {
        sqlx::query!(
            r#"UPDATE recall_records SET status = ? WHERE id = ?"#,
            new_status,
            id
        )
        .execute(pool.inner())
        .await
    };

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                RecallRecord,
                r#"SELECT id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites, notified_at as "notified_at: _", completed_at as "completed_at: _", created_at as "created_at: _" FROM recall_records WHERE id = ?"#,
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
