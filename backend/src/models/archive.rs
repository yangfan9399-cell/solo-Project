use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Archive {
    pub id: String,
    pub book_id: String,
    pub title: String,
    pub r#type: ArchiveType,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub description: Option<String>,
    pub uploaded_by: Option<String>,
    pub uploaded_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ArchiveType {
    Image,
    Document,
    Record,
    Other,
}

impl ArchiveType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ArchiveType::Image => "image",
            ArchiveType::Document => "document",
            ArchiveType::Record => "record",
            ArchiveType::Other => "other",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "image" => Some(ArchiveType::Image),
            "document" => Some(ArchiveType::Document),
            "record" => Some(ArchiveType::Record),
            "other" => Some(ArchiveType::Other),
            _ => None,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            ArchiveType::Image => "影像资料",
            ArchiveType::Document => "文档",
            ArchiveType::Record => "修复记录",
            ArchiveType::Other => "其他",
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateArchiveRequest {
    pub book_id: String,
    pub title: String,
    pub r#type: ArchiveType,
    pub file_path: Option<String>,
    pub file_size: Option<i64>,
    pub description: Option<String>,
    pub uploaded_by: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateArchiveRequest {
    pub title: Option<String>,
    pub r#type: Option<ArchiveType>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ArchiveStatistics {
    pub total_books: i64,
    pub total_archives: i64,
    pub image_count: i64,
    pub document_count: i64,
    pub record_count: i64,
    pub books_without_images: i64,
}

impl Archive {
    pub fn new(req: CreateArchiveRequest) -> Self {
        let now = Utc::now();
        Archive {
            id: Uuid::new_v4().to_string(),
            book_id: req.book_id,
            title: req.title,
            r#type: req.r#type,
            file_path: req.file_path,
            file_size: req.file_size,
            description: req.description,
            uploaded_by: req.uploaded_by,
            uploaded_at: now,
        }
    }
}
