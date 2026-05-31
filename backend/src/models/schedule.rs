use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Schedule {
    pub id: String,
    pub book_id: String,
    pub restorer_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateScheduleRequest {
    pub book_id: String,
    pub restorer_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateScheduleRequest {
    pub start_time: Option<DateTime<Utc>>,
    pub end_time: Option<DateTime<Utc>>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ScheduleConflict {
    pub schedule_id: String,
    pub book_title: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
}

impl Schedule {
    pub fn new(req: CreateScheduleRequest) -> Self {
        let now = Utc::now();
        Schedule {
            id: Uuid::new_v4().to_string(),
            book_id: req.book_id,
            restorer_id: req.restorer_id,
            start_time: req.start_time,
            end_time: req.end_time,
            description: req.description,
            created_at: now,
        }
    }
}
