use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, SiteInventory};

#[get("/api/site-inventories?<site_id>&<status>")]
pub async fn get_all(
    pool: &State<SqlitePool>,
    site_id: Option<String>,
    status: Option<String>,
) -> Json<ApiResponse<Vec<SiteInventory>>> {
    let mut query = r#"SELECT id, site_id, batch_id, batch_no, vaccine_name, expected_quantity, actual_quantity, status, last_checked as "last_checked: _", created_at as "created_at: _" FROM site_inventories WHERE 1=1"#.to_string();
    let mut params: Vec<String> = Vec::new();

    if let Some(s) = site_id {
        query.push_str(" AND site_id = ?");
        params.push(s);
    }
    if let Some(st) = status {
        query.push_str(" AND status = ?");
        params.push(st);
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

#[post("/api/site-inventories", data = "<data>")]
pub async fn create(pool: &State<SqlitePool>, data: Json<SiteInventory>) -> Json<ApiResponse<SiteInventory>> {
    let id = Uuid::new_v4().to_string();
    
    let status = if data.expected_quantity == data.actual_quantity {
        "normal"
    } else {
        "mismatch"
    };
    
    let result = sqlx::query!(
        r#"INSERT INTO site_inventories (id, site_id, batch_id, batch_no, vaccine_name, expected_quantity, actual_quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#,
        id,
        data.site_id,
        data.batch_id,
        data.batch_no,
        data.vaccine_name,
        data.expected_quantity,
        data.actual_quantity,
        status
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                SiteInventory,
                r#"SELECT id, site_id, batch_id, batch_no, vaccine_name, expected_quantity, actual_quantity, status, last_checked as "last_checked: _", created_at as "created_at: _" FROM site_inventories WHERE id = ?"#,
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

#[put("/api/site-inventories/<id>/reconcile", data = "<data>")]
pub async fn reconcile(
    pool: &State<SqlitePool>,
    id: String,
    data: Json<serde_json::Value>,
) -> Json<ApiResponse<SiteInventory>> {
    let actual_quantity = data["actual_quantity"].as_i64().unwrap_or(0) as i32;
    
    let result = sqlx::query!(
        r#"UPDATE site_inventories SET actual_quantity = ?, status = 'reconciled', last_checked = CURRENT_TIMESTAMP WHERE id = ?"#,
        actual_quantity,
        id
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                SiteInventory,
                r#"SELECT id, site_id, batch_id, batch_no, vaccine_name, expected_quantity, actual_quantity, status, last_checked as "last_checked: _", created_at as "created_at: _" FROM site_inventories WHERE id = ?"#,
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
