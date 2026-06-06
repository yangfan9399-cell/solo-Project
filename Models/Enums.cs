namespace SurgicalInstrumentTracking.Models;

public enum InstrumentSetStatus
{
    Packed,
    Sterilized,
    ReadyForUse,
    InUse,
    Returned,
    MissingItems,
    Expired,
    WrongDepartment,
    Replenished,
    Quarantine
}

public enum UserRole
{
    SupplyStaff,
    OperatingRoomNurse,
    QualityReviewer
}

public enum AnomalyType
{
    MissingItems,
    SterilizationExpired,
    WrongDepartment,
    Damaged,
    Other
}

public enum TrackingAction
{
    Packed,
    Sterilized,
    ReadyForRelease,
    Released,
    Received,
    Returned,
    QualityPassed,
    QualityRejected,
    ReplenishmentStarted,
    ReplenishmentCompleted,
    AnomalyReported,
    Quarantined
}
