use rocket::serde::json::Json;
use rocket::http::Status;
use rocket_sync_db_pools::rusqlite::params;
use serde_json::Value;

use crate::db::DbConn;
use crate::models::user::{User, UserRole, CreateUserRequest, LoginRequest, LoginResponse};

#[get("/users")]
pub async fn get_users(conn: DbConn) -> Result<Json<Vec<User>>, Status> {
    let users = conn.run(|c| {
        let mut stmt = c.prepare("SELECT id, username, password, name, role, phone, email, created_at, updated_at FROM users ORDER BY created_at DESC")?;
        let user_iter = stmt.query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                password: row.get(2)?,
                name: row.get(3)?,
                role: UserRole::from_str(&row.get::<_, String>(4)?).unwrap_or(UserRole::Restorer),
                phone: row.get(5)?,
                email: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        let mut users = Vec::new();
        for user in user_iter {
            users.push(user?);
        }
        Ok::<Vec<User>, rusqlite::Error>(users)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(users))
}

#[get("/users/<id>")]
pub async fn get_user(conn: DbConn, id: String) -> Result<Json<User>, Status> {
    let user = conn.run(move |c| {
        let mut stmt = c.prepare("SELECT id, username, password, name, role, phone, email, created_at, updated_at FROM users WHERE id = ?1")?;
        let user = stmt.query_row(params![id], |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                password: row.get(2)?,
                name: row.get(3)?,
                role: UserRole::from_str(&row.get::<_, String>(4)?).unwrap_or(UserRole::Restorer),
                phone: row.get(5)?,
                email: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        Ok::<User, rusqlite::Error>(user)
    }).await.map_err(|_| Status::NotFound)?;
    
    Ok(Json(user))
}

#[post("/users", data = "<req>")]
pub async fn create_user(conn: DbConn, req: Json<CreateUserRequest>) -> Result<Json<User>, Status> {
    let user = User::new(req.into_inner());
    
    conn.run(move |c| {
        c.execute(
            "INSERT INTO users (id, username, password, name, role, phone, email, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                user.id,
                user.username,
                user.password,
                user.name,
                user.role.as_str(),
                user.phone,
                user.email,
                user.created_at,
                user.updated_at,
            ],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(user))
}

#[post("/login", data = "<req>")]
pub async fn login(conn: DbConn, req: Json<LoginRequest>) -> Result<Json<LoginResponse>, Status> {
    let user = conn.run(move |c| {
        let mut stmt = c.prepare("SELECT id, username, password, name, role, phone, email, created_at, updated_at FROM users WHERE username = ?1 AND password = ?2")?;
        let user = stmt.query_row(params![req.username, req.password], |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                password: row.get(2)?,
                name: row.get(3)?,
                role: UserRole::from_str(&row.get::<_, String>(4)?).unwrap_or(UserRole::Restorer),
                phone: row.get(5)?,
                email: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        Ok::<User, rusqlite::Error>(user)
    }).await.map_err(|_| Status::Unauthorized)?;
    
    Ok(Json(LoginResponse {
        user,
        token: "dummy_token".to_string(),
    }))
}
