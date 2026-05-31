use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub password: String,
    pub name: String,
    pub role: UserRole,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum UserRole {
    Restorer,
    Librarian,
    Expert,
}

impl UserRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            UserRole::Restorer => "restorer",
            UserRole::Librarian => "librarian",
            UserRole::Expert => "expert",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "restorer" => Some(UserRole::Restorer),
            "librarian" => Some(UserRole::Librarian),
            "expert" => Some(UserRole::Expert),
            _ => None,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
    pub name: String,
    pub role: UserRole,
    pub phone: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub user: User,
    pub token: String,
}

impl User {
    pub fn new(req: CreateUserRequest) -> Self {
        let now = Utc::now();
        User {
            id: Uuid::new_v4().to_string(),
            username: req.username,
            password: req.password,
            name: req.name,
            role: req.role,
            phone: req.phone,
            email: req.email,
            created_at: now,
            updated_at: now,
        }
    }
}
