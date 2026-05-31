use rocket::serde::json::Json;
use rocket::http::Status;
use rocket_sync_db_pools::rusqlite::params;
use chrono::{Utc, DateTime};

use crate::db::DbConn;
use crate::models::schedule::{Schedule, ScheduleConflict, CreateScheduleRequest, UpdateScheduleRequest};

#[get("/schedules?<restorer_id>&<start_date>&<end_date>")]
pub async fn get_schedules(conn: DbConn, restorer_id: Option<String>, start_date: Option<String>, end_date: Option<String>) -> Result<Json<Vec<Schedule>>, Status> {
    let schedules = conn.run(move |c| {
        let mut query = "SELECT id, book_id, restorer_id, start_time, end_time, description, created_at FROM schedules WHERE 1=1".to_string();
        let mut params_vec: Vec<String> = Vec::new();
        
        if let Some(r) = restorer_id {
            query.push_str(" AND restorer_id = ?");
            params_vec.push(r);
        }
        if let Some(s) = start_date {
            query.push_str(" AND start_time >= ?");
            params_vec.push(s);
        }
        if let Some(e) = end_date {
            query.push_str(" AND end_time <= ?");
            params_vec.push(e);
        }
        query.push_str(" ORDER BY start_time ASC");
        
        let mut stmt = c.prepare(&query)?;
        let schedule_iter = stmt.query_map(rusqlite::params_from_iter(params_vec), |row| {
            Ok(Schedule {
                id: row.get(0)?,
                book_id: row.get(1)?,
                restorer_id: row.get(2)?,
                start_time: row.get(3)?,
                end_time: row.get(4)?,
                description: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;
        let mut schedules = Vec::new();
        for schedule in schedule_iter {
            schedules.push(schedule?);
        }
        Ok::<Vec<Schedule>, rusqlite::Error>(schedules)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(schedules))
}

#[get("/schedules/conflicts?<restorer_id>&<start_time>&<end_time>")]
pub async fn check_conflicts(conn: DbConn, restorer_id: String, start_time: String, end_time: String) -> Result<Json<Vec<ScheduleConflict>>, Status> {
    let conflicts = conn.run(move |c| {
        let mut stmt = c.prepare("
            SELECT s.id, b.title, s.start_time, s.end_time 
            FROM schedules s 
            JOIN books b ON s.book_id = b.id 
            WHERE s.restorer_id = ?1 
            AND s.start_time < ?2 
            AND s.end_time > ?3
        ")?;
        let conflict_iter = stmt.query_map(params![restorer_id, end_time, start_time], |row| {
            Ok(ScheduleConflict {
                schedule_id: row.get(0)?,
                book_title: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
            })
        })?;
        let mut conflicts = Vec::new();
        for conflict in conflict_iter {
            conflicts.push(conflict?);
        }
        Ok::<Vec<ScheduleConflict>, rusqlite::Error>(conflicts)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(conflicts))
}

#[get("/schedules/<id>")]
pub async fn get_schedule(conn: DbConn, id: String) -> Result<Json<Schedule>, Status> {
    let schedule = conn.run(move |c| {
        let mut stmt = c.prepare("SELECT id, book_id, restorer_id, start_time, end_time, description, created_at FROM schedules WHERE id = ?1")?;
        let schedule = stmt.query_row(params![id], |row| {
            Ok(Schedule {
                id: row.get(0)?,
                book_id: row.get(1)?,
                restorer_id: row.get(2)?,
                start_time: row.get(3)?,
                end_time: row.get(4)?,
                description: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;
        Ok::<Schedule, rusqlite::Error>(schedule)
    }).await.map_err(|_| Status::NotFound)?;
    
    Ok(Json(schedule))
}

#[post("/schedules", data = "<req>")]
pub async fn create_schedule(conn: DbConn, req: Json<CreateScheduleRequest>) -> Result<Json<Schedule>, Status> {
    let schedule = Schedule::new(req.into_inner());
    
    conn.run(move |c| {
        c.execute(
            "INSERT INTO schedules (id, book_id, restorer_id, start_time, end_time, description, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                schedule.id,
                schedule.book_id,
                schedule.restorer_id,
                schedule.start_time,
                schedule.end_time,
                schedule.description,
                schedule.created_at,
            ],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(schedule))
}

#[put("/schedules/<id>", data = "<req>")]
pub async fn update_schedule(conn: DbConn, id: String, req: Json<UpdateScheduleRequest>) -> Result<Json<Schedule>, Status> {
    conn.run(move |c| {
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(ref start) = req.start_time {
            updates.push("start_time = ?");
            params_vec.push(Box::new(*start));
        }
        if let Some(ref end) = req.end_time {
            updates.push("end_time = ?");
            params_vec.push(Box::new(*end));
        }
        if let Some(ref desc) = req.description {
            updates.push("description = ?");
            params_vec.push(Box::new(desc.clone()));
        }
        
        if updates.is_empty() {
            return Err(rusqlite::Error::InvalidQuery);
        }
        
        params_vec.push(Box::new(id.clone()));
        
        let query = format!("UPDATE schedules SET {} WHERE id = ?", updates.join(", "));
        c.execute(&query, rusqlite::params_from_iter(params_vec))
    }).await.map_err(|_| Status::InternalServerError)?;
    
    get_schedule(conn, id).await
}

#[delete("/schedules/<id>")]
pub async fn delete_schedule(conn: DbConn, id: String) -> Status {
    let result = conn.run(move |c| {
        c.execute("DELETE FROM schedules WHERE id = ?1", params![id])
    }).await;
    
    match result {
        Ok(1) => Status::NoContent,
        Ok(_) => Status::NotFound,
        Err(_) => Status::InternalServerError,
    }
}
