use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, ReviewRecord};

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
pub async fn create(pool: &State<SqlitePool>, data: Json<ReviewRecord>) -> Json<ApiResponse<ReviewRecord>> {
    let id = Uuid::new_v4().to_string();
    
    let mut tx = pool.inner().begin().await.unwrap();
    
    sqlx::query!(
        r#"INSERT INTO review_records (id, quarantine_id, deviation_id, reviewer_id, review_opinion, review_result) VALUES (?, ?, ?, ?, ?, ?)"#,
        id,
        data.quarantine_id,
        data.deviation_id,
        data.reviewer_id,
        data.review_opinion,
        data.review_result
    )
    .execute(&mut *tx)
    .await
    .unwrap();

    let new_batch_status = match data.review_result.as_str() {
        "release" => "released",
        "recall" => "recalled",
        "destroy" => "destroyed",
        _ => "quarantined",
    };

    sqlx::query!(
        r#"UPDATE quarantine_records SET status = ? WHERE id = ?"#,
        new_batch_status,
        data.quarantine_id
    )
    .execute(&mut *tx)
    .await
    .unwrap();

    let quarantine = sqlx::query!(
        r#"SELECT batch_id FROM quarantine_records WHERE id = ?"#,
        data.quarantine_id
    )
    .fetch_one(&mut *tx)
    .await
    .unwrap();

    sqlx::query!(
        r#"UPDATE vaccine_batches SET status = ? WHERE id = ?"#,
        new_batch_status,
        quarantine.batch_id
    )
    .execute(&mut *tx)
    .await
    .unwrap();

    tx.commit().await.unwrap();

    let item = sqlx::query_as!(
        ReviewRecord,
        r#"SELECT id, quarantine_id, deviation_id, reviewer_id, review_opinion, review_result, reviewed_at as "reviewed_at: _" FROM review_records WHERE id = ?"#,
        id
    )
    .fetch_one(pool.inner())
    .await
    .unwrap();

    Json(ApiResponse::success(item))
}
