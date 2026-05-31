use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, TransportBox};

#[get("/api/transport-boxes")]
pub async fn get_all(pool: &State<SqlitePool>) -> Json<ApiResponse<Vec<TransportBox>>> {
    let result = sqlx::query_as!(
        TransportBox,
        r#"SELECT id, name, code, model, capacity, min_temp, max_temp, current_location, status, created_at as "created_at: _" FROM transport_boxes ORDER BY created_at DESC"#
    )
    .fetch_all(pool.inner())
    .await;

    match result {
        Ok(items) => Json(ApiResponse::success(items)),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[get("/api/transport-boxes/<id>")]
pub async fn get_by_id(pool: &State<SqlitePool>, id: String) -> Json<ApiResponse<TransportBox>> {
    let result = sqlx::query_as!(
        TransportBox,
        r#"SELECT id, name, code, model, capacity, min_temp, max_temp, current_location, status, created_at as "created_at: _" FROM transport_boxes WHERE id = ?"#,
        id
    )
    .fetch_optional(pool.inner())
    .await;

    match result {
        Ok(Some(item)) => Json(ApiResponse::success(item)),
        Ok(None) => Json(ApiResponse::error("转运箱不存在".to_string())),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[post("/api/transport-boxes", data = "<data>")]
pub async fn create(pool: &State<SqlitePool>, data: Json<TransportBox>) -> Json<ApiResponse<TransportBox>> {
    let id = Uuid::new_v4().to_string();
    
    let result = sqlx::query!(
        r#"INSERT INTO transport_boxes (id, name, code, model, capacity, min_temp, max_temp, current_location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        id,
        data.name,
        data.code,
        data.model,
        data.capacity,
        data.min_temp,
        data.max_temp,
        data.current_location,
        "idle"
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                TransportBox,
                r#"SELECT id, name, code, model, capacity, min_temp, max_temp, current_location, status, created_at as "created_at: _" FROM transport_boxes WHERE id = ?"#,
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

#[put("/api/transport-boxes/<id>", data = "<data>")]
pub async fn update(pool: &State<SqlitePool>, id: String, data: Json<TransportBox>) -> Json<ApiResponse<TransportBox>> {
    let result = sqlx::query!(
        r#"UPDATE transport_boxes SET name = ?, code = ?, model = ?, capacity = ?, min_temp = ?, max_temp = ?, current_location = ?, status = ? WHERE id = ?"#,
        data.name,
        data.code,
        data.model,
        data.capacity,
        data.min_temp,
        data.max_temp,
        data.current_location,
        data.status,
        id
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                TransportBox,
                r#"SELECT id, name, code, model, capacity, min_temp, max_temp, current_location, status, created_at as "created_at: _" FROM transport_boxes WHERE id = ?"#,
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

#[delete("/api/transport-boxes/<id>")]
pub async fn delete(pool: &State<SqlitePool>, id: String) -> Json<ApiResponse<bool>> {
    let result = sqlx::query!("DELETE FROM transport_boxes WHERE id = ?", id)
        .execute(pool.inner())
        .await;

    match result {
        Ok(_) => Json(ApiResponse::success(true)),
        Err(e) => Json(ApiResponse::error(format!("删除失败: {}", e))),
    }
}
