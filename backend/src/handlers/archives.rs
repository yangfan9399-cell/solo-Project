use rocket::serde::json::Json;
use rocket::http::Status;
use rocket_sync_db_pools::rusqlite::params;
use chrono::Utc;

use crate::db::DbConn;
use crate::models::archive::{Archive, ArchiveType, ArchiveStatistics, CreateArchiveRequest, UpdateArchiveRequest};

#[get("/archives?<book_id>&<type>")]
pub async fn get_archives(conn: DbConn, book_id: Option<String>, r#type: Option<String>) -> Result<Json<Vec<Archive>>, Status> {
    let archives = conn.run(move |c| {
        let mut query = "SELECT id, book_id, title, type, file_path, file_size, description, uploaded_by, uploaded_at FROM archives WHERE 1=1".to_string();
        let mut params_vec: Vec<String> = Vec::new();
        
        if let Some(b) = book_id {
            query.push_str(" AND book_id = ?");
            params_vec.push(b);
        }
        if let Some(t) = r#type {
            query.push_str(" AND type = ?");
            params_vec.push(t);
        }
        query.push_str(" ORDER BY uploaded_at DESC");
        
        let mut stmt = c.prepare(&query)?;
        let archive_iter = stmt.query_map(rusqlite::params_from_iter(params_vec), |row| {
            Ok(Archive {
                id: row.get(0)?,
                book_id: row.get(1)?,
                title: row.get(2)?,
                r#type: ArchiveType::from_str(&row.get::<_, String>(3)?).unwrap_or(ArchiveType::Other),
                file_path: row.get(4)?,
                file_size: row.get(5)?,
                description: row.get(6)?,
                uploaded_by: row.get(7)?,
                uploaded_at: row.get(8)?,
            })
        })?;
        let mut archives = Vec::new();
        for archive in archive_iter {
            archives.push(archive?);
        }
        Ok::<Vec<Archive>, rusqlite::Error>(archives)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(archives))
}

#[get("/archives/statistics")]
pub async fn get_archive_statistics(conn: DbConn) -> Result<Json<ArchiveStatistics>, Status> {
    let stats = conn.run(|c| {
        let total_books: i64 = c.query_row("SELECT COUNT(*) FROM books", [], |r| r.get(0))?;
        let total_archives: i64 = c.query_row("SELECT COUNT(*) FROM archives", [], |r| r.get(0))?;
        let image_count: i64 = c.query_row("SELECT COUNT(*) FROM archives WHERE type = 'image'", [], |r| r.get(0))?;
        let document_count: i64 = c.query_row("SELECT COUNT(*) FROM archives WHERE type = 'document'", [], |r| r.get(0))?;
        let record_count: i64 = c.query_row("SELECT COUNT(*) FROM archives WHERE type = 'record'", [], |r| r.get(0))?;
        let books_without_images: i64 = c.query_row(
            "SELECT COUNT(*) FROM books WHERE id NOT IN (SELECT DISTINCT book_id FROM archives WHERE type = 'image')",
            [],
            |r| r.get(0)
        )?;
        
        Ok::<ArchiveStatistics, rusqlite::Error>(ArchiveStatistics {
            total_books,
            total_archives,
            image_count,
            document_count,
            record_count,
            books_without_images,
        })
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(stats))
}

#[get("/archives/<id>")]
pub async fn get_archive(conn: DbConn, id: String) -> Result<Json<Archive>, Status> {
    let archive = conn.run(move |c| {
        let mut stmt = c.prepare("SELECT id, book_id, title, type, file_path, file_size, description, uploaded_by, uploaded_at FROM archives WHERE id = ?1")?;
        let archive = stmt.query_row(params![id], |row| {
            Ok(Archive {
                id: row.get(0)?,
                book_id: row.get(1)?,
                title: row.get(2)?,
                r#type: ArchiveType::from_str(&row.get::<_, String>(3)?).unwrap_or(ArchiveType::Other),
                file_path: row.get(4)?,
                file_size: row.get(5)?,
                description: row.get(6)?,
                uploaded_by: row.get(7)?,
                uploaded_at: row.get(8)?,
            })
        })?;
        Ok::<Archive, rusqlite::Error>(archive)
    }).await.map_err(|_| Status::NotFound)?;
    
    Ok(Json(archive))
}

#[post("/archives", data = "<req>")]
pub async fn create_archive(conn: DbConn, req: Json<CreateArchiveRequest>) -> Result<Json<Archive>, Status> {
    let archive = Archive::new(req.into_inner());
    
    conn.run(move |c| {
        c.execute(
            "INSERT INTO archives (id, book_id, title, type, file_path, file_size, description, uploaded_by, uploaded_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                archive.id,
                archive.book_id,
                archive.title,
                archive.r#type.as_str(),
                archive.file_path,
                archive.file_size,
                archive.description,
                archive.uploaded_by,
                archive.uploaded_at,
            ],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(archive))
}

#[put("/archives/<id>", data = "<req>")]
pub async fn update_archive(conn: DbConn, id: String, req: Json<UpdateArchiveRequest>) -> Result<Json<Archive>, Status> {
    conn.run(move |c| {
        let mut updates = Vec::new();
        let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
        
        if let Some(ref title) = req.title {
            updates.push("title = ?");
            params_vec.push(Box::new(title.clone()));
        }
        if let Some(ref t) = req.r#type {
            updates.push("type = ?");
            params_vec.push(Box::new(t.as_str().to_string()));
        }
        if let Some(ref desc) = req.description {
            updates.push("description = ?");
            params_vec.push(Box::new(desc.clone()));
        }
        
        if updates.is_empty() {
            return Err(rusqlite::Error::InvalidQuery);
        }
        
        params_vec.push(Box::new(id.clone()));
        
        let query = format!("UPDATE archives SET {} WHERE id = ?", updates.join(", "));
        c.execute(&query, rusqlite::params_from_iter(params_vec))
    }).await.map_err(|_| Status::InternalServerError)?;
    
    get_archive(conn, id).await
}

#[delete("/archives/<id>")]
pub async fn delete_archive(conn: DbConn, id: String) -> Status {
    let result = conn.run(move |c| {
        c.execute("DELETE FROM archives WHERE id = ?1", params![id])
    }).await;
    
    match result {
        Ok(1) => Status::NoContent,
        Ok(_) => Status::NotFound,
        Err(_) => Status::InternalServerError,
    }
}
