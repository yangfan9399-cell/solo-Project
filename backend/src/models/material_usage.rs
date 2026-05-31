use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialUsage {
    pub id: String,
    pub process_id: String,
    pub material_id: String,
    pub quantity: f64,
    pub used_by: String,
    pub used_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateMaterialUsageRequest {
    pub process_id: String,
    pub material_id: String,
    pub quantity: f64,
    pub used_by: String,
}

impl MaterialUsage {
    pub fn new(req: CreateMaterialUsageRequest) -> Self {
        let now = Utc::now();
        MaterialUsage {
            id: Uuid::new_v4().to_string(),
            process_id: req.process_id,
            material_id: req.material_id,
            quantity: req.quantity,
            used_by: req.used_by,
            used_at: now,
        }
    }
}
