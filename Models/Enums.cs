namespace FuelManagementSystem.Models;

public enum ApplicationStatus
{
    PendingApproval,
    Approved,
    Rejected,
    BunkeringInProgress,
    BunkeringCompleted,
    SamplePending,
    SampleConfirmed,
    SettlementPending,
    Settled,
    Cancelled
}

public enum FuelType
{
    VLSFO,
    LSMGO,
    HFO,
    MGO,
    MDO
}

public enum DiscrepancyReason
{
    None,
    TemperatureDifference,
    MeasurementError,
    SupplyShortage,
    Leakage,
    Other
}

public enum SettlementPeriod
{
    Weekly,
    Monthly,
    Quarterly,
    Yearly
}
