namespace WaterQuotaSystem.Models;

public enum ApplicationStatus
{
    Accepted = 1,
    Processing = 2,
    Reviewing = 3,
    Approved = 4,
    Blocked = 5,
    ReturnedForEvidence = 6,
    Archived = 7,
    Timeout = 8
}
