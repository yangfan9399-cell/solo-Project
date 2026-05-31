use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Disease {
    pub id: String,
    pub book_id: String,
    pub r#type: DiseaseType,
    pub severity: DiseaseSeverity,
    pub location: Option<String>,
    pub description: Option<String>,
    pub diagnosed_by: Option<String>,
    pub diagnosed_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DiseaseType {
    Acidification,
    MothDamage,
    Mold,
    Tear,
    Stain,
    Brittleness,
    Other,
}

impl DiseaseType {
    pub fn as_str(&self) -> &'static str {
        match self {
            DiseaseType::Acidification => "acidification",
            DiseaseType::MothDamage => "moth_damage",
            DiseaseType::Mold => "mold",
            DiseaseType::Tear => "tear",
            DiseaseType::Stain => "stain",
            DiseaseType::Brittleness => "brittleness",
            DiseaseType::Other => "other",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "acidification" => Some(DiseaseType::Acidification),
            "moth_damage" => Some(DiseaseType::MothDamage),
            "mold" => Some(DiseaseType::Mold),
            "tear" => Some(DiseaseType::Tear),
            "stain" => Some(DiseaseType::Stain),
            "brittleness" => Some(DiseaseType::Brittleness),
            "other" => Some(DiseaseType::Other),
            _ => None,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            DiseaseType::Acidification => "酸化",
            DiseaseType::MothDamage => "虫蛀",
            DiseaseType::Mold => "霉斑",
            DiseaseType::Tear => "撕裂",
            DiseaseType::Stain => "污渍",
            DiseaseType::Brittleness => "脆化",
            DiseaseType::Other => "其他",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DiseaseSeverity {
    Mild,
    Moderate,
    Severe,
    Critical,
}

impl DiseaseSeverity {
    pub fn as_str(&self) -> &'static str {
        match self {
            DiseaseSeverity::Mild => "mild",
            DiseaseSeverity::Moderate => "moderate",
            DiseaseSeverity::Severe => "severe",
            DiseaseSeverity::Critical => "critical",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "mild" => Some(DiseaseSeverity::Mild),
            "moderate" => Some(DiseaseSeverity::Moderate),
            "severe" => Some(DiseaseSeverity::Severe),
            "critical" => Some(DiseaseSeverity::Critical),
            _ => None,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            DiseaseSeverity::Mild => "轻度",
            DiseaseSeverity::Moderate => "中度",
            DiseaseSeverity::Severe => "重度",
            DiseaseSeverity::Critical => "危重度",
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateDiseaseRequest {
    pub book_id: String,
    pub r#type: DiseaseType,
    pub severity: DiseaseSeverity,
    pub location: Option<String>,
    pub description: Option<String>,
    pub diagnosed_by: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateDiseaseRequest {
    pub r#type: Option<DiseaseType>,
    pub severity: Option<DiseaseSeverity>,
    pub location: Option<String>,
    pub description: Option<String>,
    pub diagnosed_by: Option<String>,
}

impl Disease {
    pub fn new(req: CreateDiseaseRequest) -> Self {
        let now = Utc::now();
        Disease {
            id: Uuid::new_v4().to_string(),
            book_id: req.book_id,
            r#type: req.r#type,
            severity: req.severity,
            location: req.location,
            description: req.description,
            diagnosed_by: req.diagnosed_by,
            diagnosed_at: now,
            updated_at: now,
        }
    }
}
