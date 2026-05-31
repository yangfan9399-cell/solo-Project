use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Review {
    pub id: String,
    pub book_id: String,
    pub reviewer_id: String,
    pub r#type: ReviewType,
    pub status: ReviewStatus,
    pub comments: Option<String>,
    pub submitted_at: DateTime<Utc>,
    pub reviewed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ReviewType {
    DiseaseDiagnosis,
    RepairProcess,
    FinalArchive,
}

impl ReviewType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ReviewType::DiseaseDiagnosis => "disease_diagnosis",
            ReviewType::RepairProcess => "repair_process",
            ReviewType::FinalArchive => "final_archive",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "disease_diagnosis" => Some(ReviewType::DiseaseDiagnosis),
            "repair_process" => Some(ReviewType::RepairProcess),
            "final_archive" => Some(ReviewType::FinalArchive),
            _ => None,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            ReviewType::DiseaseDiagnosis => "病害诊断复核",
            ReviewType::RepairProcess => "修复过程复核",
            ReviewType::FinalArchive => "最终归档复核",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ReviewStatus {
    Pending,
    Approved,
    Rejected,
    NeedRevision,
}

impl ReviewStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ReviewStatus::Pending => "pending",
            ReviewStatus::Approved => "approved",
            ReviewStatus::Rejected => "rejected",
            ReviewStatus::NeedRevision => "need_revision",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(ReviewStatus::Pending),
            "approved" => Some(ReviewStatus::Approved),
            "rejected" => Some(ReviewStatus::Rejected),
            "need_revision" => Some(ReviewStatus::NeedRevision),
            _ => None,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            ReviewStatus::Pending => "待复核",
            ReviewStatus::Approved => "已通过",
            ReviewStatus::Rejected => "已拒绝",
            ReviewStatus::NeedRevision => "需修改",
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateReviewRequest {
    pub book_id: String,
    pub reviewer_id: String,
    pub r#type: ReviewType,
    pub comments: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateReviewStatusRequest {
    pub status: ReviewStatus,
    pub comments: Option<String>,
}

impl Review {
    pub fn new(req: CreateReviewRequest) -> Self {
        let now = Utc::now();
        Review {
            id: Uuid::new_v4().to_string(),
            book_id: req.book_id,
            reviewer_id: req.reviewer_id,
            r#type: req.r#type,
            status: ReviewStatus::Pending,
            comments: req.comments,
            submitted_at: now,
            reviewed_at: None,
        }
    }
}
