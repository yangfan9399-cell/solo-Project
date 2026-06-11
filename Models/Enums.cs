namespace OceanFarm.Models;

public enum UserRole
{
    PatrolInspector,
    FeedingOperator,
    Veterinarian,
    FarmManager
}

public enum AnomalyType
{
    None,
    LowDissolvedOxygen,
    InsufficientFeed,
    DiseaseSuspected
}

public enum FeedingStatus
{
    Pending,
    Normal,
    Abnormal,
    Cancelled
}

public enum DiseaseStatus
{
    Reported,
    Reviewed,
    Confirmed,
    Rejected,
    Resolved
}

public enum DisposalStatus
{
    Pending,
    Approved,
    Rejected,
    Completed
}
