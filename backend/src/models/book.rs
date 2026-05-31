use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: String,
    pub title: String,
    pub author: Option<String>,
    pub dynasty: Option<String>,
    pub year: Option<String>,
    pub material: Option<String>,
    pub dimensions: Option<String>,
    pub page_count: Option<i32>,
    pub location: Option<String>,
    pub status: BookStatus,
    pub entered_by: String,
    pub entered_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum BookStatus {
    Pending,
    Diagnosing,
    Scheduled,
    Repairing,
    Reviewing,
    Completed,
    Archived,
}

impl BookStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            BookStatus::Pending => "pending",
            BookStatus::Diagnosing => "diagnosing",
            BookStatus::Scheduled => "scheduled",
            BookStatus::Repairing => "repairing",
            BookStatus::Reviewing => "reviewing",
            BookStatus::Completed => "completed",
            BookStatus::Archived => "archived",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(BookStatus::Pending),
            "diagnosing" => Some(BookStatus::Diagnosing),
            "scheduled" => Some(BookStatus::Scheduled),
            "repairing" => Some(BookStatus::Repairing),
            "reviewing" => Some(BookStatus::Reviewing),
            "completed" => Some(BookStatus::Completed),
            "archived" => Some(BookStatus::Archived),
            _ => None,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateBookRequest {
    pub title: String,
    pub author: Option<String>,
    pub dynasty: Option<String>,
    pub year: Option<String>,
    pub material: Option<String>,
    pub dimensions: Option<String>,
    pub page_count: Option<i32>,
    pub location: Option<String>,
    pub entered_by: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBookRequest {
    pub title: Option<String>,
    pub author: Option<String>,
    pub dynasty: Option<String>,
    pub year: Option<String>,
    pub material: Option<String>,
    pub dimensions: Option<String>,
    pub page_count: Option<i32>,
    pub location: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBookStatusRequest {
    pub status: BookStatus,
}

impl Book {
    pub fn new(req: CreateBookRequest) -> Self {
        let now = Utc::now();
        Book {
            id: Uuid::new_v4().to_string(),
            title: req.title,
            author: req.author,
            dynasty: req.dynasty,
            year: req.year,
            material: req.material,
            dimensions: req.dimensions,
            page_count: req.page_count,
            location: req.location,
            status: BookStatus::Pending,
            entered_by: req.entered_by,
            entered_at: now,
            updated_at: now,
        }
    }
}
