#[macro_use]
extern crate rocket;

use rocket::fairing::AdHoc;
use rocket::http::{Header, Method};
use rocket_cors::{AllowedOrigins, CorsOptions};

mod db;
mod models;
mod handlers;
mod schema;

use handlers::*;

#[launch]
fn rocket() -> _ {
    env_logger::init();

    let cors = CorsOptions::default()
        .allowed_origins(AllowedOrigins::all())
        .allowed_methods(
            vec![Method::Get, Method::Post, Method::Put, Method::Delete, Method::Patch]
                .into_iter()
                .map(From::from)
                .collect(),
        )
        .allow_credentials(true);

    rocket::build()
        .attach(db::DbConn::fairing())
        .attach(AdHoc::on_ignite("Database Migrations", db::run_migrations))
        .attach(cors.to_cors().unwrap())
        .mount("/api", routes![
            users::get_users,
            users::get_user,
            users::create_user,
            users::login,

            books::get_books,
            books::get_book,
            books::create_book,
            books::update_book,
            books::update_book_status,
            books::delete_book,

            diseases::get_diseases,
            diseases::get_disease,
            diseases::create_disease,
            diseases::update_disease,
            diseases::delete_disease,

            processes::get_processes,
            processes::get_process,
            processes::create_process,
            processes::update_process,
            processes::update_process_status,
            processes::delete_process,
            processes::update_process_order,

            materials::get_materials,
            materials::get_material,
            materials::create_material,
            materials::update_material,
            materials::delete_material,
            materials::get_low_stock_materials,

            material_usages::get_material_usages,
            material_usages::get_material_usage,
            material_usages::create_material_usage,
            material_usages::delete_material_usage,

            reviews::get_reviews,
            reviews::get_review,
            reviews::create_review,
            reviews::update_review_status,
            reviews::delete_review,

            archives::get_archives,
            archives::get_archive,
            archives::create_archive,
            archives::update_archive,
            archives::delete_archive,
            archives::get_archive_statistics,

            schedules::get_schedules,
            schedules::get_schedule,
            schedules::create_schedule,
            schedules::update_schedule,
            schedules::delete_schedule,
            schedules::check_conflicts,
        ])
        .register("/", catchers![not_found, internal_server_error])
}

#[catch(404)]
fn not_found() -> rocket::serde::json::Json<serde_json::Value> {
    rocket::serde::json::Json(serde_json::json!({
        "error": "Resource not found",
        "code": 404
    }))
}

#[catch(500)]
fn internal_server_error() -> rocket::serde::json::Json<serde_json::Value> {
    rocket::serde::json::Json(serde_json::json!({
        "error": "Internal server error",
        "code": 500
    }))
}
