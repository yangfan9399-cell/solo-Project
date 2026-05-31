use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, TemperatureRecord};

#[get("/api/temperature-records?<device_type>&<device_id>&<limit>")]
pub async fn get_all(
    pool: &State<SqlitePool>,
    device_type: Option<String>,
    device_id: Option<String>,
    limit: Option<i32>,
) -> Json<ApiResponse<Vec<TemperatureRecord>>> {
    let limit = limit.unwrap_or(100);
    let mut query = r#"SELECT id, device_type, device_id, temperature, recorded_at as "recorded_at: _", is_normal FROM temperature_records WHERE 1=1"#.to_string();
    let mut params: Vec<String> = Vec::new();

    if let Some(dt) = device_type {
        query.push_str(" AND device_type = ?");
        params.push(dt);
    }
    if let Some(di) = device_id {
        query.push_str(" AND device_id = ?");
        params.push(di);
    }
    
    query.push_str(" ORDER BY recorded_at DESC LIMIT ?");

    let mut query_builder = sqlx::query_as(&query);
    for param in &params {
        query_builder = query_builder.bind(param);
    }
    query_builder = query_builder.bind(limit);

    let result = query_builder.fetch_all(pool.inner()).await;

    match result {
        Ok(items) => Json(ApiResponse::success(items)),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[post("/api/temperature-records", data = "<data>")]
pub async fn create(pool: &State<SqlitePool>, data: Json<TemperatureRecord>) -> Json<ApiResponse<TemperatureRecord>> {
    let id = Uuid::new_v4().to_string();
    
    let result = sqlx::query!(
        r#"INSERT INTO temperature_records (id, device_type, device_id, temperature, is_normal) VALUES (?, ?, ?, ?, ?)"#,
        id,
        data.device_type,
        data.device_id,
        data.temperature,
        data.is_normal
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                TemperatureRecord,
                r#"SELECT id, device_type, device_id, temperature, recorded_at as "recorded_at: _", is_normal FROM temperature_records WHERE id = ?"#,
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
