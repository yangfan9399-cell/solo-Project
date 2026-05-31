use rocket::serde::json::Json;
use rocket::http::Status;
use rocket_sync_db_pools::rusqlite::params;
use chrono::Utc;

use crate::db::DbConn;
use crate::models::review::{Review, ReviewType, ReviewStatus, CreateReviewRequest, UpdateReviewStatusRequest};

#[get("/reviews?<book_id>&<status>&<type>")]
pub async fn get_reviews(conn: DbConn, book_id: Option<String>, status: Option<String>, r#type: Option<String>) -> Result<Json<Vec<Review>>, Status> {
    let reviews = conn.run(move |c| {
        let mut query = "SELECT id, book_id, reviewer_id, type, status, comments, submitted_at, reviewed_at FROM reviews WHERE 1=1".to_string();
        let mut params_vec: Vec<String> = Vec::new();
        
        if let Some(b) = book_id {
            query.push_str(" AND book_id = ?");
            params_vec.push(b);
        }
        if let Some(s) = status {
            query.push_str(" AND status = ?");
            params_vec.push(s);
        }
        if let Some(t) = r#type {
            query.push_str(" AND type = ?");
            params_vec.push(t);
        }
        query.push_str(" ORDER BY submitted_at DESC");
        
        let mut stmt = c.prepare(&query)?;
        let review_iter = stmt.query_map(rusqlite::params_from_iter(params_vec), |row| {
            Ok(Review {
                id: row.get(0)?,
                book_id: row.get(1)?,
                reviewer_id: row.get(2)?,
                r#type: ReviewType::from_str(&row.get::<_, String>(3)?).unwrap_or(ReviewType::DiseaseDiagnosis),
                status: ReviewStatus::from_str(&row.get::<_, String>(4)?).unwrap_or(ReviewStatus::Pending),
                comments: row.get(5)?,
                submitted_at: row.get(6)?,
                reviewed_at: row.get(7)?,
            })
        })?;
        let mut reviews = Vec::new();
        for review in review_iter {
            reviews.push(review?);
        }
        Ok::<Vec<Review>, rusqlite::Error>(reviews)
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(reviews))
}

#[get("/reviews/<id>")]
pub async fn get_review(conn: DbConn, id: String) -> Result<Json<Review>, Status> {
    let review = conn.run(move |c| {
        let mut stmt = c.prepare("SELECT id, book_id, reviewer_id, type, status, comments, submitted_at, reviewed_at FROM reviews WHERE id = ?1")?;
        let review = stmt.query_row(params![id], |row| {
            Ok(Review {
                id: row.get(0)?,
                book_id: row.get(1)?,
                reviewer_id: row.get(2)?,
                r#type: ReviewType::from_str(&row.get::<_, String>(3)?).unwrap_or(ReviewType::DiseaseDiagnosis),
                status: ReviewStatus::from_str(&row.get::<_, String>(4)?).unwrap_or(ReviewStatus::Pending),
                comments: row.get(5)?,
                submitted_at: row.get(6)?,
                reviewed_at: row.get(7)?,
            })
        })?;
        Ok::<Review, rusqlite::Error>(review)
    }).await.map_err(|_| Status::NotFound)?;
    
    Ok(Json(review))
}

#[post("/reviews", data = "<req>")]
pub async fn create_review(conn: DbConn, req: Json<CreateReviewRequest>) -> Result<Json<Review>, Status> {
    let review = Review::new(req.into_inner());
    
    conn.run(move |c| {
        c.execute(
            "INSERT INTO reviews (id, book_id, reviewer_id, type, status, comments, submitted_at, reviewed_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                review.id,
                review.book_id,
                review.reviewer_id,
                review.r#type.as_str(),
                review.status.as_str(),
                review.comments,
                review.submitted_at,
                review.reviewed_at,
            ],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    Ok(Json(review))
}

#[patch("/reviews/<id>/status", data = "<req>")]
pub async fn update_review_status(conn: DbConn, id: String, req: Json<UpdateReviewStatusRequest>) -> Result<Json<Review>, Status> {
    conn.run(move |c| {
        c.execute(
            "UPDATE reviews SET status = ?1, comments = ?2, reviewed_at = ?3 WHERE id = ?4",
            params![req.status.as_str(), req.comments, Utc::now(), id],
        )
    }).await.map_err(|_| Status::InternalServerError)?;
    
    get_review(conn, id).await
}

#[delete("/reviews/<id>")]
pub async fn delete_review(conn: DbConn, id: String) -> Status {
    let result = conn.run(move |c| {
        c.execute("DELETE FROM reviews WHERE id = ?1", params![id])
    }).await;
    
    match result {
        Ok(1) => Status::NoContent,
        Ok(_) => Status::NotFound,
        Err(_) => Status::InternalServerError,
    }
}
