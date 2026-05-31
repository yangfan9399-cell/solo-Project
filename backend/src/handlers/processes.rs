use rocket::serde::json::Json;
use rocket::http::Status;
use rocket_sync_db_pools::rusqlite::params;
use chrono::Utc;

use crate::db::DbConn;
use crate::models::process::{Process, ProcessStatus, CreateProcessRequest, UpdateProcessRequest, UpdateProcessStatusRequest, UpdateProcessOrderRequest};

#[get("/processes?<book_id>&<status>")]
pub async fn get_processes(conn: DbConn, book_id: Option<String>, status: Option<String>) -> Result<Json<Vec<Process>>, Status> {
    let processes = conn.run(move |c| {
        let mut query = "SELECT id, book_id, name, description, estimated_duration, actual_duration, assignee, status, order_index, created_by, created_at, updated_at FROM processes WHERE 1=1".to_string();
        let mut params_vec: Vec<String> = Vec::new();
        
        if let Some(b) = book_id {
            query.push_str(" AND book_id = ?");
            params_vec.push(b);
        }
        if let Some(s) = status {
            query.push_str(" AND status = ?");
            params_vec.push(s);
        }
        query.push_str(" ORDER BY order_index ASC, created_at DESC");
        
        let mut stmt = c.prepare(&query)?;
        let process_iter = stmt.query_map(rusqlite::params_from_iter(params_vec), |row| {
            Ok(Process {
                id: row.get(0)?,
                book_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                estimated_duration: row.get(4)?,
                actual_duration: row.get(5)?,
                assignee: row.get(6)?,
                status: ProcessStatus::from_str(&row.get::<_, String>(7)?).unwrap_or(ProcessStatus::Pending),
                order_index: row.get(8)?,
                created_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        let mut processes = Vec::new();
        for process in process_iter {
            processes.push(process?);
        }
        Ok::<Vec<Process>, rusqlite::Error>(processes)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(processes))
}

#[get("/processes/<id>")]
pub async fn get_process(conn: DbConn, id: String) -> Result<Json<Process>, Status> {
    let process = conn.run(move |c| {
        let mut stmt = c.prepare("SELECT id, book_id, name, description, estimated_duration, actual_duration, assignee, status, order_index, created_by, created_at, updated_at FROM processes WHERE id = ?1")?;
        let process = stmt.query_row(params![id], |row| {
            Ok(Process {
                id: row.get(0)?,
                book_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                estimated_duration: row.get(4)?,
                actual_duration: row.get(5)?,
                assignee: row.get(6)?,
                status: ProcessStatus::from_str(&row.get::<_, String>(7)?).unwrap_or(ProcessStatus::Pending),
                order_index: row.get(8)?,
                created_by: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        Ok::<Process, rusqlite::Error>(process)
    }).await.map_err(|_| Status::NotFound)?;
    
    Ok(Json(process))
}

#[post("/processes", data = "<req>")]
pub async fn create_process(conn: DbConn, req: Json<CreateProcessRequest>) -> Result<Json<Process>, Status> {
    let process = Process::new(req.into_inner());
    
    conn.run(move |c| {
        c.execute(
            "INSERT INTO processes (id, book_id, name, description, estimated_duration, actual_duration, assignee, status, order_index, created_by, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                process.id,
                process.book_id,
                process.name,
                process.description,
                process.estimated_duration,
                process.actual_duration,
                process.assignee,
                process.status.as_str(),
                process.order_index,
                process.created_by,
                process.created_at,
                process.updated_at,
            ],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(process))
}

#[put("/processes/<id>", data = "<req>")]
pub async fn update_process(conn: DbConn, id: String, req: Json<UpdateProcessRequest>) -> Result<Json<Process>, Status> {
    conn.run(move |c| {
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(ref name) = req.name {
            updates.push("name = ?");
            params_vec.push(Box::new(name.clone()));
        }
        if let Some(ref desc) = req.description {
            updates.push("description = ?");
            params_vec.push(Box::new(desc.clone()));
        }
        if let Some(ref est) = req.estimated_duration {
            updates.push("estimated_duration = ?");
            params_vec.push(Box::new(*est));
        }
        if let Some(ref act) = req.actual_duration {
            updates.push("actual_duration = ?");
            params_vec.push(Box::new(*act));
        }
        if let Some(ref assignee) = req.assignee {
            updates.push("assignee = ?");
            params_vec.push(Box::new(assignee.clone()));
        }
        if let Some(ref ord) = req.order_index {
            updates.push("order_index = ?");
            params_vec.push(Box::new(*ord));
        }
        
        if updates.is_empty() {
            return Err(rusqlite::Error::InvalidQuery);
        }
        
        updates.push("updated_at = ?");
        params_vec.push(Box::new(Utc::now()));
        
        params_vec.push(Box::new(id.clone()));
        
        let query = format!("UPDATE processes SET {} WHERE id = ?", updates.join(", "));
        c.execute(&query, rusqlite::params_from_iter(params_vec))
    }).await.map_err(|_| Status::InternalServerError)?;
    
    get_process(conn, id).await
}

#[patch("/processes/<id>/status", data = "<req>")]
pub async fn update_process_status(conn: DbConn, id: String, req: Json<UpdateProcessStatusRequest>) -> Result<Json<Process>, Status> {
    conn.run(move |c| {
        c.execute(
            "UPDATE processes SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![req.status.as_str(), Utc::now(), id],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    get_process(conn, id).await
}

#[patch("/processes/<id>/order", data = "<req>")]
pub async fn update_process_order(conn: DbConn, id: String, req: Json<UpdateProcessOrderRequest>) -> Result<Json<Process>, Status> {
    conn.run(move |c| {
        c.execute(
            "UPDATE processes SET order_index = ?1, updated_at = ?2 WHERE id = ?3",
            params![req.new_order, Utc::now(), id],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    get_process(conn, id).await
}

#[delete("/processes/<id>")]
pub async fn delete_process(conn: DbConn, id: String) -> Status {
    let result = conn.run(move |c| {
        c.execute("DELETE FROM processes WHERE id = ?1", params![id])
    }).await;
    
    match result {
        Ok(1) => Status::NoContent,
        Ok(_) => Status::NotFound,
        Err(_) => Status::InternalServerError,
    }
}
