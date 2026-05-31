use rocket::serde::json::Json;
use rocket::http::Status;
use rocket_sync_db_pools::rusqlite::params;
use chrono::Utc;

use crate::db::DbConn;
use crate::models::book::{Book, BookStatus, CreateBookRequest, UpdateBookRequest, UpdateBookStatusRequest};

#[get("/books?<status>&<dynasty>")]
pub async fn get_books(conn: DbConn, status: Option<String>, dynasty: Option<String>) -> Result<Json<Vec<Book>>, Status> {
    let books = conn.run(move |c| {
        let mut query = "SELECT id, title, author, dynasty, year, material, dimensions, page_count, location, status, entered_by, entered_at, updated_at FROM books WHERE 1=1".to_string();
        let mut params_vec: Vec<String> = Vec::new();
        
        if let Some(s) = status {
            query.push_str(" AND status = ?");
            params_vec.push(s);
        }
        if let Some(d) = dynasty {
            query.push_str(" AND dynasty LIKE ?");
            params_vec.push(format!("%{}%", d));
        }
        query.push_str(" ORDER BY entered_at DESC");
        
        let mut stmt = c.prepare(&query)?;
        let book_iter = stmt.query_map(rusqlite::params_from_iter(params_vec), |row| {
            Ok(Book {
                id: row.get(0)?,
                title: row.get(1)?,
                author: row.get(2)?,
                dynasty: row.get(3)?,
                year: row.get(4)?,
                material: row.get(5)?,
                dimensions: row.get(6)?,
                page_count: row.get(7)?,
                location: row.get(8)?,
                status: BookStatus::from_str(&row.get::<_, String>(9)?).unwrap_or(BookStatus::Pending),
                entered_by: row.get(10)?,
                entered_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;
        let mut books = Vec::new();
        for book in book_iter {
            books.push(book?);
        }
        Ok::<Vec<Book>, rusqlite::Error>(books)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(books))
}

#[get("/books/<id>")]
pub async fn get_book(conn: DbConn, id: String) -> Result<Json<Book>, Status> {
    let book = conn.run(move |c| {
        let mut stmt = c.prepare("SELECT id, title, author, dynasty, year, material, dimensions, page_count, location, status, entered_by, entered_at, updated_at FROM books WHERE id = ?1")?;
        let book = stmt.query_row(params![id], |row| {
            Ok(Book {
                id: row.get(0)?,
                title: row.get(1)?,
                author: row.get(2)?,
                dynasty: row.get(3)?,
                year: row.get(4)?,
                material: row.get(5)?,
                dimensions: row.get(6)?,
                page_count: row.get(7)?,
                location: row.get(8)?,
                status: BookStatus::from_str(&row.get::<_, String>(9)?).unwrap_or(BookStatus::Pending),
                entered_by: row.get(10)?,
                entered_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;
        Ok::<Book, rusqlite::Error>(book)
    }).await.map_err(|_| Status::NotFound)?;
    
    Ok(Json(book))
}

#[post("/books", data = "<req>")]
pub async fn create_book(conn: DbConn, req: Json<CreateBookRequest>) -> Result<Json<Book>, Status> {
    let book = Book::new(req.into_inner());
    
    conn.run(move |c| {
        c.execute(
            "INSERT INTO books (id, title, author, dynasty, year, material, dimensions, page_count, location, status, entered_by, entered_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                book.id,
                book.title,
                book.author,
                book.dynasty,
                book.year,
                book.material,
                book.dimensions,
                book.page_count,
                book.location,
                book.status.as_str(),
                book.entered_by,
                book.entered_at,
                book.updated_at,
            ],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(book))
}

#[put("/books/<id>", data = "<req>")]
pub async fn update_book(conn: DbConn, id: String, req: Json<UpdateBookRequest>) -> Result<Json<Book>, Status> {
    conn.run(move |c| {
        let mut updates = Vec::new();
        let mut params_vec: Vec<&dyn rusqlite::ToSql> = Vec::new();
        
        if let Some(ref title) = req.title {
            updates.push("title = ?");
            params_vec.push(title);
        }
        if let Some(ref author) = req.author {
            updates.push("author = ?");
            params_vec.push(author);
        }
        if let Some(ref dynasty) = req.dynasty {
            updates.push("dynasty = ?");
            params_vec.push(dynasty);
        }
        if let Some(ref year) = req.year {
            updates.push("year = ?");
            params_vec.push(year);
        }
        if let Some(ref material) = req.material {
            updates.push("material = ?");
            params_vec.push(material);
        }
        if let Some(ref dimensions) = req.dimensions {
            updates.push("dimensions = ?");
            params_vec.push(dimensions);
        }
        if let Some(ref page_count) = req.page_count {
            updates.push("page_count = ?");
            params_vec.push(page_count);
        }
        if let Some(ref location) = req.location {
            updates.push("location = ?");
            params_vec.push(location);
        }
        
        if updates.is_empty() {
            return Err(rusqlite::Error::InvalidQuery);
        }
        
        updates.push("updated_at = ?");
        let now = Utc::now();
        params_vec.push(&now);
        
        params_vec.push(&id);
        
        let query = format!("UPDATE books SET {} WHERE id = ?", updates.join(", "));
        c.execute(&query, rusqlite::params_from_iter(params_vec))
    }).await.map_err(|_| Status::InternalServerError)?;
    
    get_book(conn, id).await
}

#[patch("/books/<id>/status", data = "<req>")]
pub async fn update_book_status(conn: DbConn, id: String, req: Json<UpdateBookStatusRequest>) -> Result<Json<Book>, Status> {
    conn.run(move |c| {
        c.execute(
            "UPDATE books SET status = ?1, updated_at = ?2 WHERE id = ?3",
            params![req.status.as_str(), Utc::now(), id],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    get_book(conn, id).await
}

#[delete("/books/<id>")]
pub async fn delete_book(conn: DbConn, id: String) -> Status {
    let result = conn.run(move |c| {
        c.execute("DELETE FROM books WHERE id = ?1", params![id])
    }).await;
    
    match result {
        Ok(1) => Status::NoContent,
        Ok(_) => Status::NotFound,
        Err(_) => Status::InternalServerError,
    }
}
