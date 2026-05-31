use rocket::{serde::json::Json, State};
use sqlx::SqlitePool;
use uuid::Uuid;
use crate::models::{ApiResponse, VaccinationSite};

#[get("/api/vaccination-sites")]
pub async fn get_all(pool: &State<SqlitePool>) -> Json<ApiResponse<Vec<VaccinationSite>>> {
    let result = sqlx::query_as!(
        VaccinationSite,
        r#"SELECT id, name, code, address, manager_name, manager_phone, status, created_at as "created_at: _" FROM vaccination_sites ORDER BY created_at DESC"#
    )
    .fetch_all(pool.inner())
    .await;

    match result {
        Ok(items) => Json(ApiResponse::success(items)),
        Err(e) => Json(ApiResponse::error(format!("数据库错误: {}", e))),
    }
}

#[post("/api/vaccination-sites", data = "<data>")]
pub async fn create(pool: &State<SqlitePool>, data: Json<VaccinationSite>) -> Json<ApiResponse<VaccinationSite>> {
    let id = Uuid::new_v4().to_string();
    
    let result = sqlx::query!(
        r#"INSERT INTO vaccination_sites (id, name, code, address, manager_name, manager_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)"#,
        id,
        data.name,
        data.code,
        data.address,
        data.manager_name,
        data.manager_phone,
        "active"
    )
    .execute(pool.inner())
    .await;

    match result {
        Ok(_) => {
            let item = sqlx::query_as!(
                VaccinationSite,
                r#"SELECT id, name, code, address, manager_name, manager_phone, status, created_at as "created_at: _" FROM vaccination_sites WHERE id = ?"#,
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
