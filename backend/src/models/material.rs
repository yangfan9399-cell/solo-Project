use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Material {
    pub id: String,
    pub name: String,
    pub category: MaterialCategory,
    pub specification: Option<String>,
    pub unit: String,
    pub stock_quantity: f64,
    pub min_stock: f64,
    pub unit_price: Option<f64>,
    pub supplier: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MaterialCategory {
    Paper,
    Adhesive,
    Tool,
    Chemical,
    Other,
}

impl MaterialCategory {
    pub fn as_str(&self) -> &'static str {
        match self {
            MaterialCategory::Paper => "paper",
            MaterialCategory::Adhesive => "adhesive",
            MaterialCategory::Tool => "tool",
            MaterialCategory::Chemical => "chemical",
            MaterialCategory::Other => "other",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "paper" => Some(MaterialCategory::Paper),
            "adhesive" => Some(MaterialCategory::Adhesive),
            "tool" => Some(MaterialCategory::Tool),
            "chemical" => Some(MaterialCategory::Chemical),
            "other" => Some(MaterialCategory::Other),
            _ => None,
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            MaterialCategory::Paper => "纸张",
            MaterialCategory::Adhesive => "胶粘剂",
            MaterialCategory::Tool => "工具",
            MaterialCategory::Chemical => "化学品",
            MaterialCategory::Other => "其他",
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateMaterialRequest {
    pub name: String,
    pub category: MaterialCategory,
    pub specification: Option<String>,
    pub unit: String,
    pub stock_quantity: f64,
    pub min_stock: f64,
    pub unit_price: Option<f64>,
    pub supplier: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMaterialRequest {
    pub name: Option<String>,
    pub category: Option<MaterialCategory>,
    pub specification: Option<String>,
    pub unit: Option<String>,
    pub stock_quantity: Option<f64>,
    pub min_stock: Option<f64>,
    pub unit_price: Option<f64>,
    pub supplier: Option<String>,
}

impl Material {
    pub fn new(req: CreateMaterialRequest) -> Self {
        let now = Utc::now();
        Material {
            id: Uuid::new_v4().to_string(),
            name: req.name,
            category: req.category,
            specification: req.specification,
            unit: req.unit,
            stock_quantity: req.stock_quantity,
            min_stock: req.min_stock,
            unit_price: req.unit_price,
            supplier: req.supplier,
            created_at: now,
            updated_at: now,
        }
    }
}
