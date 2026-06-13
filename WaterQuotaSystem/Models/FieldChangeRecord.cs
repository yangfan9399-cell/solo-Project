namespace WaterQuotaSystem.Models;

public class FieldChangeRecord
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public int ProcessingNodeId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public string FieldDisplayName { get; set; } = string.Empty;
    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public bool IsKeyChange { get; set; }

    public WaterQuotaApplication Application { get; set; } = null!;
    public ProcessingNode ProcessingNode { get; set; } = null!;
}
