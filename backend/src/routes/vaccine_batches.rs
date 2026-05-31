use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, VaccineBatch};

#[get("/api/vaccine-batches?<status>&<vaccine_name>")]
pub async fn get_all(
    pool: &State<SqlitePool>,
    status: Option<String>,
    vaccine_name: Option<String>,
) -> Json<ApiResponse<Vec<VaccineBatch>>> {
    let mut query = r#"SELECT id, batch_no, vaccine_name, manufacturer, production_date, expiry_date, total_quantity, available_quantity, storage_location_type, storage_location_id, current_location, status, created_at as "created_at: _" FROM vaccine_batches WHERE 1=1"#.to_string();
    let mut params: Vec<String> = Vec::new();

    if let Some(s) = status {
        query.push_str(" AND status = ?");
        params.push(s);
    }
    if let Some(v) = vaccine_name {
        query.push_str(" AND vaccine_name LIKE ?");
        params.push(format!("%{}%", v));
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

#[get("/api/vaccine-batches/<id>")]
pub async fn get_by_id(pool: &State<SqlitePool>, id: String) -> Json<ApiResponse<VaccineBatch>> {
    let result = sqlx::query_as!(
        VaccineBatch,
        r#"SELECT id, batch_no, vaccine_name, manufacturer, production_date, expiry_date, total_quantity, available_quantity, storage_location_type, storage_location_id, current_location, status, created_at as "created_at: _" FROM vaccine_batches WHERE id = ?"#,
        id
    )
    .fetch_optional(pool.inner())
    .await;

    match result {
        Ok(Some(item)) => Json(ApiResponse::success(item)),
        Ok(None) => Json(ApiResponse::error("批次不存在".to_string())),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[post("/api/vaccine-batches", data = "<data>")]
pub async fn create(pool: &State<SqlitePool>, data: Json<VaccineBatch>) -> Json<ApiResponse<VaccineBatch>> {
    let id = Uuid::new_v4().to_string();
    
    let result = sqlx::query!(
        r#"INSERT INTO vaccine_batches (id, batch_no, vaccine_name, manufacturer, production_date, expiry_date, total_quantity, available_quantity, storage_location_type, storage_location_id, current_location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        id,
        data.batch_no,
        data.vaccine_name,
        data.manufacturer,
        data.production_date,
        data.expiry_date,
        data.total_quantity,
        data.available_quantity,
        data.storage_location_type,
        data.storage_location_id,
        data.current_location,
        "normal"
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                VaccineBatch,
                r#"SELECT id, batch_no, vaccine_name, manufacturer, production_date, expiry_date, total_quantity, available_quantity, storage_location_type, storage_location_id, current_location, status, created_at as "created_at: _" FROM vaccine_batches WHERE id = ?"#,
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
