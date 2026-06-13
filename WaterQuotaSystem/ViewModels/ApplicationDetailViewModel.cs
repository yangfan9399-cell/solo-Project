using WaterQuotaSystem.Models;

namespace WaterQuotaSystem.ViewModels;

public class ApplicationDetailViewModel
{
    public WaterQuotaApplication Application { get; set; } = null!;
    public List<ProcessingNode> HistoryNodes { get; set; } = [];
    public List<FieldChangeRecord> FieldChanges { get; set; } = [];
    public List<EvidenceAttachment> Attachments { get; set; } = [];
    public List<FieldDiffItem> KeyFieldDiffs { get; set; } = [];
}

public class FieldDiffItem
{
    public string FieldName { get; set; } = string.Empty;
    public string FieldDisplayName { get; set; } = string.Empty;
    public string OldValue { get; set; } = string.Empty;
    public string NewValue { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}
