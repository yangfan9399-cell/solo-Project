use rocket::{serde::json::Json, State};
use sqlx::{SqlitePool, Row};
use uuid::Uuid;
use crate::models::{
    ApiResponse, RecallRecord, CreateRecallRequest, UpdateRecallStatusRequest,
    PendingRecallBatch, SiteInventorySummary, RecallDetail, RecallSiteNotification
};

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
pub async fn create(pool: &State<SqlitePool>, data: Json<CreateRecallRequest>) -> Json<ApiResponse<RecallRecord>> {
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
    data: Json<UpdateRecallStatusRequest>,
) -> Json<ApiResponse<RecallRecord>> {
    let new_status = data.status.as_str();
    
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

#[get("/api/recall-records/pending")]
pub async fn get_pending_recalls(pool: &State<SqlitePool>) -> Json<ApiResponse<Vec<RecallRecord>>> {
    let result = sqlx::query_as!(
        RecallRecord,
        r#"SELECT id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites, notified_at as "notified_at: _", completed_at as "completed_at: _", created_at as "created_at: _" FROM recall_records WHERE status IN ('notified', 'in_progress') ORDER BY created_at DESC"#
    )
    .fetch_all(pool.inner())
    .await;

    match result {
        Ok(items) => Json(ApiResponse::success(items)),
        Err(e) => Json(ApiResponse::error(format!("查询失败: {}", e))),
    }
}

#[get("/api/recall-batches/pending")]
pub async fn get_pending_recall_batches(pool: &State<SqlitePool>) -> Json<ApiResponse<Vec<PendingRecallBatch>>> {
    let quarantines = match sqlx::query!(
        r#"SELECT q.id as quarantine_id, q.batch_id, q.deviation_id, q.reason as deviation_reason,
                  b.batch_no, b.vaccine_name, b.manufacturer, b.total_quantity
           FROM quarantine_records q
           JOIN vaccine_batches b ON q.batch_id = b.id
           WHERE q.status = 'pending_review'
           ORDER BY q.priority DESC, q.created_at DESC"#
    )
    .fetch_all(pool.inner())
    .await {
        Ok(rows) => rows,
        Err(e) => return Json(ApiResponse::error(format!("查询待召回批次失败: {}", e))),
    };

    let mut batches: Vec<PendingRecallBatch> = Vec::new();

    for q in quarantines {
        let inventories = sqlx::query_as!(
            SiteInventorySummary,
            r#"SELECT si.site_id, vs.name as site_name, si.expected_quantity, si.actual_quantity
               FROM site_inventories si
               JOIN vaccination_sites vs ON si.site_id = vs.id
               WHERE si.batch_id = ? AND si.status != 'reconciled'"#,
            q.batch_id
        )
        .fetch_all(pool.inner())
        .await
        .unwrap_or_default();

        batches.push(PendingRecallBatch {
            batch_id: q.batch_id,
            batch_no: q.batch_no,
            vaccine_name: q.vaccine_name,
            manufacturer: q.manufacturer,
            total_quantity: q.total_quantity,
            quarantine_id: q.quarantine_id,
            deviation_id: q.deviation_id,
            deviation_reason: q.deviation_reason,
            site_inventories: inventories,
        });
    }

    Json(ApiResponse::success(batches))
}

#[get("/api/recall-records/<id>/detail")]
pub async fn get_recall_detail(pool: &State<SqlitePool>, id: String) -> Json<ApiResponse<RecallDetail>> {
    let record = match sqlx::query_as!(
        RecallRecord,
        r#"SELECT id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites, notified_at as "notified_at: _", completed_at as "completed_at: _", created_at as "created_at: _" FROM recall_records WHERE id = ?"#,
        id
    )
    .fetch_optional(pool.inner())
    .await {
        Ok(Some(r)) => r,
        Ok(None) => return Json(ApiResponse::error("召回记录不存在".to_string())),
        Err(e) => return Json(ApiResponse::error(format!("查询失败: {}", e))),
    };

    let notifications = sqlx::query_as!(
        RecallSiteNotification,
        r#"SELECT id, recall_id, site_id, site_name, quantity, notified, 
                  notified_at as "notified_at: _", confirmed, 
                  confirmed_at as "confirmed_at: _", returned_quantity, note,
                  created_at as "created_at: _"
           FROM recall_site_notifications WHERE recall_id = ? ORDER BY created_at"#,
        id
    )
    .fetch_all(pool.inner())
    .await
    .unwrap_or_default();

    Json(ApiResponse::success(RecallDetail { record, notifications }))
}

#[put("/api/recall-site-notifications/<id>/confirm", data = "<data>")]
pub async fn confirm_site_notification(
    pool: &State<SqlitePool>,
    id: String,
    data: Json<serde_json::Value>,
) -> Json<ApiResponse<RecallSiteNotification>> {
    let returned_quantity = data["returned_quantity"].as_i64().unwrap_or(0) as i32;
    let note = data["note"].as_str().map(|s| s.to_string());

    match sqlx::query!(
        r#"UPDATE recall_site_notifications 
           SET confirmed = 1, confirmed_at = CURRENT_TIMESTAMP, returned_quantity = ?, note = ?
           WHERE id = ?"#,
        returned_quantity,
        note,
        id
    )
    .execute(pool.inner())
    .await {
        Ok(_) => {
            let notification = sqlx::query_as!(
                RecallSiteNotification,
                r#"SELECT id, recall_id, site_id, site_name, quantity, notified, 
                          notified_at as "notified_at: _", confirmed, 
                          confirmed_at as "confirmed_at: _", returned_quantity, note,
                          created_at as "created_at: _"
                   FROM recall_site_notifications WHERE id = ?"#,
                id
            )
            .fetch_one(pool.inner())
            .await
            .unwrap();
            Json(ApiResponse::success(notification))
        }
        Err(e) => Json(ApiResponse::error(format!("确认失败: {}", e))),
    }
}
