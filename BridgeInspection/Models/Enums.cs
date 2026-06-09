namespace BridgeInspection.Models;

public enum DefectSeverity
{
    Slight = 1,
    Moderate = 2,
    Severe = 3,
    Structural = 4
}

public enum DefectStatus
{
    PendingAssessment = 1,
    Assessing = 2,
    PendingMaintenance = 3,
    MaintenanceInProgress = 4,
    PendingAcceptance = 5,
    Closed = 6,
    Returned = 7
}

public enum BridgeType
{
    BeamBridge = 1,
    ArchBridge = 2,
    CableStayedBridge = 3,
    SuspensionBridge = 4,
    TrussBridge = 5,
    BoxGirderBridge = 6
}

public enum SensorStatus
{
    Online = 1,
    Offline = 2,
    Faulty = 3
}
