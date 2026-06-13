namespace WaterQuotaSystem.Models;

public class ProcessingNode
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public ApplicationStatus FromStatus { get; set; }
    public ApplicationStatus ToStatus { get; set; }
    public string Action { get; set; } = string.Empty;
    public string OperatorName { get; set; } = string.Empty;
    public RoleType OperatorRole { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string Conclusion { get; set; } = string.Empty;
    public string ResponsiblePersonBefore { get; set; } = string.Empty;
    public string ResponsiblePersonAfter { get; set; } = string.Empty;
    public DateTime OperatedAt { get; set; }

    public WaterQuotaApplication Application { get; set; } = null!;
}
