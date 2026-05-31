use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Process {
    pub id: String,
    pub book_id: String,
    pub name: String,
    pub description: Option<String>,
    pub estimated_duration: Option<i32>,
    pub actual_duration: Option<i32>,
    pub assignee: Option<String>,
    pub status: ProcessStatus,
    pub order_index: i32,
    pub created_by: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProcessStatus {
    Pending,
    InProgress,
    Completed,
    Skipped,
}

impl ProcessStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ProcessStatus::Pending => "pending",
            ProcessStatus::InProgress => "in_progress",
            ProcessStatus::Completed => "completed",
            ProcessStatus::Skipped => "skipped",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(ProcessStatus::Pending),
            "in_progress" => Some(ProcessStatus::InProgress),
            "completed" => Some(ProcessStatus::Completed),
            "skipped" => Some(ProcessStatus::Skipped),
            _ => None,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            ProcessStatus::Pending => "待处理",
            ProcessStatus::InProgress => "进行中",
            ProcessStatus::Completed => "已完成",
            ProcessStatus::Skipped => "已跳过",
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateProcessRequest {
    pub book_id: String,
    pub name: String,
    pub description: Option<String>,
    pub estimated_duration: Option<i32>,
    pub assignee: Option<String>,
    pub order_index: i32,
    pub created_by: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProcessRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub estimated_duration: Option<i32>,
    pub actual_duration: Option<i32>,
    pub assignee: Option<String>,
    pub order_index: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProcessStatusRequest {
    pub status: ProcessStatus,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProcessOrderRequest {
    pub process_id: String,
    pub new_order: i32,
}

impl Process {
    pub fn new(req: CreateProcessRequest) -> Self {
        let now = Utc::now();
        Process {
            id: Uuid::new_v4().to_string(),
            book_id: req.book_id,
            name: req.name,
            description: req.description,
            estimated_duration: req.estimated_duration,
            actual_duration: None,
            assignee: req.assignee,
            status: ProcessStatus::Pending,
            order_index: req.order_index,
            created_by: req.created_by,
            created_at: now,
            updated_at: now,
        }
    }
}
