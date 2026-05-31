use chrono::{DateTime, Utc, NaiveDate};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UserRole {
    ColdChainAdmin,
    CdcReviewer,
    VaccinationSiteManager,
}

impl ToString for UserRole {
    fn to_string(&self) -> String {
        match self {
            UserRole::ColdChainAdmin => "cold_chain_admin".to_string(),
            UserRole::CdcReviewer => "cdc_reviewer".to_string(),
            UserRole::VaccinationSiteManager => "vaccination_site_manager".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub real_name: String,
    pub role: String,
    pub phone: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl User {
    pub fn new(username: String, real_name: String, role: String, phone: Option<String>) -> Self {
        User {
            id: Uuid::new_v4().to_string(),
            username,
            real_name,
            role,
            phone,
            created_at: Utc::now(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColdStorage {
    pub id: String,
    pub name: String,
    pub code: String,
    pub location: String,
    pub capacity: i32,
    pub min_temp: f64,
    pub max_temp: f64,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransportBox {
    pub id: String,
    pub name: String,
    pub code: String,
    pub model: Option<String>,
    pub capacity: i32,
    pub min_temp: f64,
    pub max_temp: f64,
    pub current_location: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaccineBatch {
    pub id: String,
    pub batch_no: String,
    pub vaccine_name: String,
    pub manufacturer: String,
    pub production_date: NaiveDate,
    pub expiry_date: NaiveDate,
    pub total_quantity: i32,
    pub available_quantity: i32,
    pub storage_location_type: String,
    pub storage_location_id: String,
    pub current_location: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemperatureRecord {
    pub id: String,
    pub device_type: String,
    pub device_id: String,
    pub temperature: f64,
    pub recorded_at: DateTime<Utc>,
    pub is_normal: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemperatureDeviation {
    pub id: String,
    pub device_type: String,
    pub device_id: String,
    pub device_name: String,
    pub deviation_type: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration_minutes: i32,
    pub max_temp: Option<f64>,
    pub min_temp: Option<f64>,
    pub avg_temp: Option<f64>,
    pub affected_batches: Option<String>,
    pub risk_level: String,
    pub status: String,
    pub handler_id: Option<String>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuarantineRecord {
    pub id: String,
    pub deviation_id: Option<String>,
    pub batch_id: String,
    pub batch_no: String,
    pub vaccine_name: String,
    pub quantity: i32,
    pub priority: i32,
    pub reason: String,
    pub operator_id: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReviewRecord {
    pub id: String,
    pub quarantine_id: String,
    pub deviation_id: Option<String>,
    pub reviewer_id: Option<String>,
    pub review_opinion: String,
    pub review_result: String,
    pub reviewed_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecallRecord {
    pub id: String,
    pub recall_no: String,
    pub batch_id: String,
    pub batch_no: String,
    pub vaccine_name: String,
    pub total_quantity: i32,
    pub reason: String,
    pub initiator_id: Option<String>,
    pub status: String,
    pub vaccination_sites: Option<String>,
    pub notified_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaccinationSite {
    pub id: String,
    pub name: String,
    pub code: String,
    pub address: String,
    pub manager_name: Option<String>,
    pub manager_phone: Option<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteInventory {
    pub id: String,
    pub site_id: String,
    pub batch_id: String,
    pub batch_no: String,
    pub vaccine_name: String,
    pub expected_quantity: i32,
    pub actual_quantity: i32,
    pub status: String,
    pub last_checked: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: String,
    pub user_id: Option<String>,
    pub user_name: String,
    pub action: String,
    pub target_type: String,
    pub target_id: Option<String>,
    pub details: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            message: None,
        }
    }

    pub fn error(message: String) -> Self {
        ApiResponse {
            success: false,
            data: None,
            message: Some(message),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviationStats {
    pub total: i64,
    pub detected: i64,
    pub processing: i64,
    pub resolved: i64,
    pub critical: i64,
    pub high: i64,
    pub medium: i64,
    pub low: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecallStats {
    pub total: i64,
    pub notified: i64,
    pub in_progress: i64,
    pub completed: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub active_cold_storages: i64,
    pub active_transport_boxes: i64,
    pub normal_batches: i64,
    pub quarantined_batches: i64,
    pub deviations: DeviationStats,
    pub recalls: RecallStats,
    pub inventory_mismatches: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskLaneGroup {
    pub temp_zone: String,
    pub duration_range: String,
    pub items: Vec<TemperatureDeviation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TraceReport {
    pub batch_id: String,
    pub batch_no: String,
    pub vaccine_name: String,
    pub temperature_history: Vec<TemperatureRecord>,
    pub deviation_count: i64,
    pub quarantine_events: Vec<QuarantineRecord>,
    pub recall_events: Vec<RecallRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateColdStorageRequest {
    pub name: String,
    pub code: String,
    pub location: String,
    pub capacity: i32,
    pub min_temp: f64,
    pub max_temp: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateColdStorageRequest {
    pub name: String,
    pub code: String,
    pub location: String,
    pub capacity: i32,
    pub min_temp: f64,
    pub max_temp: f64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTransportBoxRequest {
    pub name: String,
    pub code: String,
    pub model: Option<String>,
    pub capacity: i32,
    pub min_temp: f64,
    pub max_temp: f64,
    pub current_location: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTransportBoxRequest {
    pub name: String,
    pub code: String,
    pub model: Option<String>,
    pub capacity: i32,
    pub min_temp: f64,
    pub max_temp: f64,
    pub current_location: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateReviewRequest {
    pub quarantine_id: String,
    pub deviation_id: Option<String>,
    pub review_opinion: String,
    pub review_result: String,
    pub reviewer_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRecallRequest {
    pub batch_id: String,
    pub batch_no: String,
    pub vaccine_name: String,
    pub total_quantity: i32,
    pub reason: String,
    pub initiator_id: Option<String>,
    pub vaccination_sites: Option<String>,
    pub quarantine_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateRecallStatusRequest {
    pub status: String,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct RecallSiteNotification {
    pub id: String,
    pub recall_id: String,
    pub site_id: String,
    pub site_name: String,
    pub quantity: i32,
    pub notified: bool,
    pub notified_at: Option<DateTime<Utc>>,
    pub confirmed: bool,
    pub confirmed_at: Option<DateTime<Utc>>,
    pub returned_quantity: Option<i32>,
    pub note: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingRecallBatch {
    pub batch_id: String,
    pub batch_no: String,
    pub vaccine_name: String,
    pub manufacturer: String,
    pub total_quantity: i32,
    pub quarantine_id: String,
    pub deviation_id: Option<String>,
    pub deviation_reason: Option<String>,
    pub site_inventories: Vec<SiteInventorySummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SiteInventorySummary {
    pub site_id: String,
    pub site_name: String,
    pub expected_quantity: i32,
    pub actual_quantity: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecallDetail {
    #[serde(flatten)]
    pub record: RecallRecord,
    pub notifications: Vec<RecallSiteNotification>,
}
