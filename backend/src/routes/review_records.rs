use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, ReviewRecord, CreateReviewRequest, VaccineBatch};

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

    if data.review_result.as_str() == "recall" {
        let batch = match sqlx::query_as!(
            VaccineBatch,
            r#"SELECT id, batch_no, vaccine_name, manufacturer, production_date as "production_date: _", expiry_date as "expiry_date: _", total_quantity, available_quantity, storage_location_type, storage_location_id, current_location, status, created_at as "created_at: _" FROM vaccine_batches WHERE id = ?"#,
            quarantine.batch_id
        )
        .fetch_one(&mut *tx)
        .await {
            Ok(b) => b,
            Err(e) => {
                let _ = tx.rollback().await;
                return Json(ApiResponse::error(format!("查询批次信息失败: {}", e)));
            }
        };

        let inventories = match sqlx::query!(
            r#"SELECT si.site_id, vs.name as site_name, si.expected_quantity, si.actual_quantity 
               FROM site_inventories si 
               JOIN vaccination_sites vs ON si.site_id = vs.id 
               WHERE si.batch_id = ? AND si.status != 'reconciled'"#,
            quarantine.batch_id
        )
        .fetch_all(&mut *tx)
        .await {
            Ok(rows) => rows,
            Err(e) => {
                let _ = tx.rollback().await;
                return Json(ApiResponse::error(format!("查询接种点库存失败: {}", e)));
            }
        };

        let recall_id = Uuid::new_v4().to_string();
        let recall_no = format!("RC{:08}", chrono::Utc::now().timestamp());
        let recall_reason = format!("温控偏差复核召回：{}", data.review_opinion);
        let sites_concat = inventories.iter()
            .map(|i| i.site_name.clone())
            .collect::<Vec<_>>()
            .join(", ");
        let sites_value = if sites_concat.is_empty() { None } else { Some(sites_concat) };

        if let Err(e) = sqlx::query!(
            r#"INSERT INTO recall_records (id, recall_no, batch_id, batch_no, vaccine_name, total_quantity, reason, initiator_id, status, vaccination_sites) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
            recall_id,
            recall_no,
            batch.id,
            batch.batch_no,
            batch.vaccine_name,
            batch.total_quantity,
            recall_reason,
            data.reviewer_id,
            "notified",
            sites_value
        )
        .execute(&mut *tx)
        .await {
            let _ = tx.rollback().await;
            return Json(ApiResponse::error(format!("创建召回记录失败: {}", e)));
        }

        for inv in inventories {
            let notification_id = Uuid::new_v4().to_string();
            if let Err(e) = sqlx::query!(
                r#"INSERT INTO recall_site_notifications (id, recall_id, site_id, site_name, quantity, notified, confirmed) 
                   VALUES (?, ?, ?, ?, ?, 1, 0)"#,
                notification_id,
                recall_id,
                inv.site_id,
                inv.site_name,
                inv.actual_quantity
            )
            .execute(&mut *tx)
            .await {
                let _ = tx.rollback().await;
                return Json(ApiResponse::error(format!("创建接种点通知失败: {}", e)));
            }
        }
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
