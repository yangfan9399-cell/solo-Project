use rocket::serde::json::Json;
use rocket::http::Status;
use rocket_sync_db_pools::rusqlite::params;
use chrono::Utc;

use crate::db::DbConn;
use crate::models::disease::{Disease, DiseaseType, DiseaseSeverity, CreateDiseaseRequest, UpdateDiseaseRequest};

#[get("/diseases?<book_id>&<type>&<severity>")]
pub async fn get_diseases(conn: DbConn, book_id: Option<String>, r#type: Option<String>, severity: Option<String>) -> Result<Json<Vec<Disease>>, Status> {
    let diseases = conn.run(move |c| {
        let mut query = "SELECT id, book_id, type, severity, location, description, diagnosed_by, diagnosed_at, updated_at FROM diseases WHERE 1=1".to_string();
        let mut params_vec: Vec<String> = Vec::new();
        
        if let Some(b) = book_id {
            query.push_str(" AND book_id = ?");
            params_vec.push(b);
        }
        if let Some(t) = r#type {
            query.push_str(" AND type = ?");
            params_vec.push(t);
        }
        if let Some(s) = severity {
            query.push_str(" AND severity = ?");
            params_vec.push(s);
        }
        query.push_str(" ORDER BY diagnosed_at DESC");
        
        let mut stmt = c.prepare(&query)?;
        let disease_iter = stmt.query_map(rusqlite::params_from_iter(params_vec), |row| {
            Ok(Disease {
                id: row.get(0)?,
                book_id: row.get(1)?,
                r#type: DiseaseType::from_str(&row.get::<_, String>(2)?).unwrap_or(DiseaseType::Other),
                severity: DiseaseSeverity::from_str(&row.get::<_, String>(3)?).unwrap_or(DiseaseSeverity::Mild),
                location: row.get(4)?,
                description: row.get(5)?,
                diagnosed_by: row.get(6)?,
                diagnosed_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        let mut diseases = Vec::new();
        for disease in disease_iter {
            diseases.push(disease?);
        }
        Ok::<Vec<Disease>, rusqlite::Error>(diseases)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(diseases))
}

#[get("/diseases/<id>")]
pub async fn get_disease(conn: DbConn, id: String) -> Result<Json<Disease>, Status> {
    let disease = conn.run(move |c| {
        let mut stmt = c.prepare("SELECT id, book_id, type, severity, location, description, diagnosed_by, diagnosed_at, updated_at FROM diseases WHERE id = ?1")?;
        let disease = stmt.query_row(params![id], |row| {
            Ok(Disease {
                id: row.get(0)?,
                book_id: row.get(1)?,
                r#type: DiseaseType::from_str(&row.get::<_, String>(2)?).unwrap_or(DiseaseType::Other),
                severity: DiseaseSeverity::from_str(&row.get::<_, String>(3)?).unwrap_or(DiseaseSeverity::Mild),
                location: row.get(4)?,
                description: row.get(5)?,
                diagnosed_by: row.get(6)?,
                diagnosed_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;
        Ok::<Disease, rusqlite::Error>(disease)
    }).await.map_err(|_| Status::NotFound)?;
    
    Ok(Json(disease))
}

#[post("/diseases", data = "<req>")]
pub async fn create_disease(conn: DbConn, req: Json<CreateDiseaseRequest>) -> Result<Json<Disease>, Status> {
    let disease = Disease::new(req.into_inner());
    
    conn.run(move |c| {
        c.execute(
            "INSERT INTO diseases (id, book_id, type, severity, location, description, diagnosed_by, diagnosed_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                disease.id,
                disease.book_id,
                disease.r#type.as_str(),
                disease.severity.as_str(),
                disease.location,
                disease.description,
                disease.diagnosed_by,
                disease.diagnosed_at,
                disease.updated_at,
            ],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(disease))
}

#[put("/diseases/<id>", data = "<req>")]
pub async fn update_disease(conn: DbConn, id: String, req: Json<UpdateDiseaseRequest>) -> Result<Json<Disease>, Status> {
    conn.run(move |c| {
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(ref t) = req.r#type {
            updates.push("type = ?");
            params_vec.push(Box::new(t.as_str().to_string()));
        }
        if let Some(ref s) = req.severity {
            updates.push("severity = ?");
            params_vec.push(Box::new(s.as_str().to_string()));
        }
        if let Some(ref loc) = req.location {
            updates.push("location = ?");
            params_vec.push(Box::new(loc.clone()));
        }
        if let Some(ref desc) = req.description {
            updates.push("description = ?");
            params_vec.push(Box::new(desc.clone()));
        }
        if let Some(ref diag) = req.diagnosed_by {
            updates.push("diagnosed_by = ?");
            params_vec.push(Box::new(diag.clone()));
        }
        
        if updates.is_empty() {
            return Err(rusqlite::Error::InvalidQuery);
        }
        
        updates.push("updated_at = ?");
        params_vec.push(Box::new(Utc::now()));
        
        params_vec.push(Box::new(id.clone()));
        
        let query = format!("UPDATE diseases SET {} WHERE id = ?", updates.join(", "));
        c.execute(&query, rusqlite::params_from_iter(params_vec))
    }).await.map_err(|_| Status::InternalServerError)?;
    
    get_disease(conn, id).await
}

#[delete("/diseases/<id>")]
pub async fn delete_disease(conn: DbConn, id: String) -> Status {
    let result = conn.run(move |c| {
        c.execute("DELETE FROM diseases WHERE id = ?1", params![id])
    }).await;
    
    match result {
        Ok(1) => Status::NoContent,
        Ok(_) => Status::NotFound,
        Err(_) => Status::InternalServerError,
    }
}
