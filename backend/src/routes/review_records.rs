use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, ReviewRecord, CreateReviewRequest};

#[get("/api/review-records")]
pub async fn get_all(pool: &State<SqlitePool>) -> Json<ApiResponse<Vec<ReviewRecord>>> {
    let result = sqlx::query_as!(
        ReviewRecord,
        r#"SELECT id, quarantine_id, deviation_id, reviewer_id, review_opinion, review_result, reviewed_at as "reviewed_at: _" FROM review_records ORDER BY reviewed_at DESC"#
    )
    .fetch_all(pool.inner())
    .await;

    match result {
        Ok(items) => Json(ApiResponse::success(items)),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[post("/api/review-records", data = "<data>")]
pub async fn create(pool: &State<SqlitePool>, data: Json<CreateReviewRequest>) -> Json<ApiResponse<ReviewRecord>> {
    let id = Uuid::new_v4().to_string();
    
    let new_batch_status = match data.review_result.as_str() {
        "release" => "released",
        "recall" => "recalled",
        "destroy" => "destroyed",
        _ => "quarantined",
    };

    let mut tx = match pool.inner().begin().await {
        Ok(tx) => tx,
        Err(e) => return Json(ApiResponse::error(format!("事务启动失败: {}", e))),
    };
    
    if let Err(e) = sqlx::query!(
        r#"INSERT INTO review_records (id, quarantine_id, deviation_id, reviewer_id, review_opinion, review_result) VALUES (?, ?, ?, ?, ?, ?)"#,
        id,
        data.quarantine_id,
        data.deviation_id,
        data.reviewer_id,
        data.review_opinion,
        data.review_result
    )
    .execute(&mut *tx)
    .await {
        let _ = tx.rollback().await;
        return Json(ApiResponse::error(format!("创建复核记录失败: {}", e)));
    }

    if let Err(e) = sqlx::query!(
        r#"UPDATE quarantine_records SET status = ? WHERE id = ?"#,
        new_batch_status,
        data.quarantine_id
    )
    .execute(&mut *tx)
    .await {
        let _ = tx.rollback().await;
        return Json(ApiResponse::error(format!("更新隔离记录失败: {}", e)));
    }

    let quarantine = match sqlx::query!(
        r#"SELECT batch_id FROM quarantine_records WHERE id = ?"#,
        data.quarantine_id
    )
    .fetch_one(&mut *tx)
    .await {
        Ok(q) => q,
        Err(e) => {
            let _ = tx.rollback().await;
            return Json(ApiResponse::error(format!("查询隔离记录失败: {}", e)));
        }
    };

    if let Err(e) = sqlx::query!(
        r#"UPDATE vaccine_batches SET status = ? WHERE id = ?"#,
        new_batch_status,
        quarantine.batch_id
    )
    .execute(&mut *tx)
    .await {
        let _ = tx.rollback().await;
        return Json(ApiResponse::error(format!("更新疫苗批次失败: {}", e)));
    }

    if let Err(e) = tx.commit().await {
        return Json(ApiResponse::error(format!("提交事务失败: {}", e)));
    }

    match sqlx::query_as!(
        ReviewRecord,
        r#"SELECT id, quarantine_id, deviation_id, reviewer_id, review_opinion, review_result, reviewed_at as "reviewed_at: _" FROM review_records WHERE id = ?"#,
        id
    )
    .fetch_one(pool.inner())
    .await {
        Ok(item) => Json(ApiResponse::success(item)),
        Err(e) => Json(ApiResponse::error(format!("查询复核记录失败: {}", e))),
    }
}
