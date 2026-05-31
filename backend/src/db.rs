use rocket_sync_db_pools::{database, rusqlite};
use rusqlite::params;

#[database("ancient_book_db")]
pub struct DbConn(pub rusqlite::Connection);

pub async fn run_migrations(rocket: rocket::Rocket<rocket::Build>) -> rocket::Rocket<rocket::Build> {
    let conn = DbConn::get_one(&rocket).await.expect("database connection");
    conn.run(|c| {
        c.execute_batch(include_str!("../schema.sql")).expect("migrations failed");
    }).await;
    rocket
}
