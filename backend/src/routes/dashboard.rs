use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use crate::models::{ApiResponse, DashboardStats, DeviationStats, RecallStats};

#[get("/api/dashboard/stats")]
pub async fn get_stats(pool: &State<SqlitePool>) -> Json<ApiResponse<DashboardStats>> {
    let active_cold_storages = sqlx::query_scalar!(
        r#"SELECT COUNT(*) as count FROM cold_storages WHERE status = 'normal'"#
    )
    .fetch_one(pool.inner())
    .await
    .unwrap_or(0);

    let active_transport_boxes = sqlx::query_scalar!(
        r#"SELECT COUNT(*) as count FROM transport_boxes WHERE status IN ('idle', 'in_transit')"#
    )
    .fetch_one(pool.inner())
    .await
    .unwrap_or(0);

    let normal_batches = sqlx::query_scalar!(
        r#"SELECT COUNT(*) as count FROM vaccine_batches WHERE status = 'normal'"#
    )
    .fetch_one(pool.inner())
    .await
    .unwrap_or(0);

    let quarantined_batches = sqlx::query_scalar!(
        r#"SELECT COUNT(*) as count FROM vaccine_batches WHERE status = 'quarantined'"#
    )
    .fetch_one(pool.inner())
    .await
    .unwrap_or(0);

    let deviation_total = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM temperature_deviations"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);
    let deviation_detected = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM temperature_deviations WHERE status = 'detected'"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);
    let deviation_processing = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM temperature_deviations WHERE status = 'processing'"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);
    let deviation_resolved = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM temperature_deviations WHERE status IN ('resolved', 'closed')"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);
    let deviation_critical = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM temperature_deviations WHERE risk_level = 'critical' AND status IN ('detected', 'processing')"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);
    let deviation_high = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM temperature_deviations WHERE risk_level = 'high' AND status IN ('detected', 'processing')"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);
    let deviation_medium = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM temperature_deviations WHERE risk_level = 'medium' AND status IN ('detected', 'processing')"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);
    let deviation_low = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM temperature_deviations WHERE risk_level = 'low' AND status IN ('detected', 'processing')"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);

    let recall_total = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM recall_records"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);
    let recall_notified = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM recall_records WHERE status = 'notified'"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);
    let recall_in_progress = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM recall_records WHERE status = 'in_progress'"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);
    let recall_completed = sqlx::query_scalar!(r#"SELECT COUNT(*) as count FROM recall_records WHERE status = 'completed'"#)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);

    let inventory_mismatches = sqlx::query_scalar!(
        r#"SELECT COUNT(*) as count FROM site_inventories WHERE status = 'mismatch'"#
    )
    .fetch_one(pool.inner())
    .await
    .unwrap_or(0);

    Json(ApiResponse::success(DashboardStats {
        active_cold_storages,
        active_transport_boxes,
        normal_batches,
        quarantined_batches,
        deviations: DeviationStats {
            total: deviation_total,
            detected: deviation_detected,
            processing: deviation_processing,
            resolved: deviation_resolved,
            critical: deviation_critical,
            high: deviation_high,
            medium: deviation_medium,
            low: deviation_low,
        },
        recalls: RecallStats {
            total: recall_total,
            notified: recall_notified,
            in_progress: recall_in_progress,
            completed: recall_completed,
        },
        inventory_mismatches,
    }))
}
