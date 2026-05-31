use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, ColdStorage};

#[get("/api/cold-storages")]
pub async fn get_all(pool: &State<SqlitePool>) -> Json<ApiResponse<Vec<ColdStorage>>> {
    let result = sqlx::query_as!(
        ColdStorage,
        r#"SELECT id, name, code, location, capacity, min_temp, max_temp, status, created_at as "created_at: _" FROM cold_storages ORDER BY created_at DESC"#
    )
    .fetch_all(pool.inner())
    .await;

    match result {
        Ok(items) => Json(ApiResponse::success(items)),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[get("/api/cold-storages/<id>")]
pub async fn get_by_id(pool: &State<SqlitePool>, id: String) -> Json<ApiResponse<ColdStorage>> {
    let result = sqlx::query_as!(
        ColdStorage,
        r#"SELECT id, name, code, location, capacity, min_temp, max_temp, status, created_at as "created_at: _" FROM cold_storages WHERE id = ?"#,
        id
    )
    .fetch_optional(pool.inner())
    .await;

    match result {
        Ok(Some(item)) => Json(ApiResponse::success(item)),
        Ok(None) => Json(ApiResponse::error("冷库不存在".to_string())),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[post("/api/cold-storages", data = "<data>")]
pub async fn create(pool: &State<SqlitePool>, data: Json<ColdStorage>) -> Json<ApiResponse<ColdStorage>> {
    let id = Uuid::new_v4().to_string();
    
    let result = sqlx::query!(
        r#"INSERT INTO cold_storages (id, name, code, location, capacity, min_temp, max_temp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#,
        id,
        data.name,
        data.code,
        data.location,
        data.capacity,
        data.min_temp,
        data.max_temp,
        "normal"
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                ColdStorage,
                r#"SELECT id, name, code, location, capacity, min_temp, max_temp, status, created_at as "created_at: _" FROM cold_storages WHERE id = ?"#,
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

#[put("/api/cold-storages/<id>", data = "<data>")]
pub async fn update(pool: &State<SqlitePool>, id: String, data: Json<ColdStorage>) -> Json<ApiResponse<ColdStorage>> {
    let result = sqlx::query!(
        r#"UPDATE cold_storages SET name = ?, code = ?, location = ?, capacity = ?, min_temp = ?, max_temp = ?, status = ? WHERE id = ?"#,
        data.name,
        data.code,
        data.location,
        data.capacity,
        data.min_temp,
        data.max_temp,
        data.status,
        id
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                ColdStorage,
                r#"SELECT id, name, code, location, capacity, min_temp, max_temp, status, created_at as "created_at: _" FROM cold_storages WHERE id = ?"#,
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

#[delete("/api/cold-storages/<id>")]
pub async fn delete(pool: &State<SqlitePool>, id: String) -> Json<ApiResponse<bool>> {
    let result = sqlx::query!("DELETE FROM cold_storages WHERE id = ?", id)
        .execute(pool.inner())
        .await;

    match result {
        Ok(_) => Json(ApiResponse::success(true)),
        Err(e) => Json(ApiResponse::error(format!("删除失败: {}", e))),
    }
}
