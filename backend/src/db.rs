use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use std::env;

pub async fn establish_connection() -> Result<SqlitePool, sqlx::Error> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:vaccine.db?mode=rwc".to_string());
    
    SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
}
