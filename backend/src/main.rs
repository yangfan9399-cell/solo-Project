#[macro_use]
extern crate rocket;

mod db;
mod models;
mod routes;

use db::establish_connection;
use routes::*;
use rocket_cors::{AllowedOrigins, CorsOptions};

#[launch]
async fn rocket() -> _ {
    dotenv::dotenv().ok();
    
    let pool = establish_connection()
        .await
        .expect("Failed to connect to database");

    let cors = CorsOptions::default()
        .allowed_origins(AllowedOrigins::all())
        .allowed_methods(
            vec!["Get", "Post", "Put", "Delete", "Options"]
                .into_iter()
                .map(|s| s.parse().unwrap())
                .collect(),
        )
        .allow_credentials(true)
        .to_cors()
        .unwrap();

    rocket::build()
        .manage(pool)
        .attach(cors)
        .mount(
            "/",
            routes![
                cold_storages::get_all,
                cold_storages::get_by_id,
                cold_storages::create,
                cold_storages::update,
                cold_storages::delete,
                transport_boxes::get_all,
                transport_boxes::get_by_id,
                transport_boxes::create,
                transport_boxes::update,
                transport_boxes::delete,
                vaccine_batches::get_all,
                vaccine_batches::get_by_id,
                vaccine_batches::create,
                temperature_records::get_all,
                temperature_records::create,
                temperature_deviations::get_all,
                temperature_deviations::get_risk_lanes,
                temperature_deviations::get_by_id,
                temperature_deviations::create,
                temperature_deviations::update_status,
                quarantine_records::get_all,
                quarantine_records::create,
                quarantine_records::update_priority,
                quarantine_records::submit_for_review,
                review_records::get_all,
                review_records::create,
                recall_records::get_all,
                recall_records::create,
                recall_records::update_status,
                vaccination_sites::get_all,
                vaccination_sites::create,
                site_inventories::get_all,
                site_inventories::create,
                site_inventories::reconcile,
                dashboard::get_stats,
                trace::get_trace_report,
                trace::get_trace_reports,
                users::get_all,
                users::get_by_id,
                users::get_by_role,
            ],
        )
}
