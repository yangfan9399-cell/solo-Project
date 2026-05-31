use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use crate::models::{ApiResponse, User};

#[get("/api/users")]
pub async fn get_all(pool: &State<SqlitePool>) -> Json<ApiResponse<Vec<User>>> {
    let result = sqlx::query_as!(
        User,
        r#"SELECT id, username, real_name, role, phone, created_at as "created_at: _" FROM users ORDER BY created_at DESC"#
    )
    .fetch_all(pool.inner())
    .await;

    match result {
        Ok(items) => Json(ApiResponse::success(items)),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[get("/api/users/<id>")]
pub async fn get_by_id(pool: &State<SqlitePool>, id: String) -> Json<ApiResponse<User>> {
    let result = sqlx::query_as!(
        User,
        r#"SELECT id, username, real_name, role, phone, created_at as "created_at: _" FROM users WHERE id = ?"#,
        id
    )
    .fetch_optional(pool.inner())
    .await;

    match result {
        Ok(Some(item)) => Json(ApiResponse::success(item)),
        Ok(None) => Json(ApiResponse::error("用户不存在".to_string())),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[get("/api/users/role/<role>")]
pub async fn get_by_role(pool: &State<SqlitePool>, role: String) -> Json<ApiResponse<Vec<User>>> {
    let result = sqlx::query_as!(
        User,
        r#"SELECT id, username, real_name, role, phone, created_at as "created_at: _" FROM users WHERE role = ? ORDER BY created_at DESC"#,
        role
    )
    .fetch_all(pool.inner())
    .await;

    match result {
        Ok(items) => Json(ApiResponse::success(items)),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}
