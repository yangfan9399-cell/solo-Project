namespace WaterQuotaSystem.Models;

public class EvidenceAttachment
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string UploadedBy { get; set; } = string.Empty;
    public RoleType UploaderRole { get; set; }
    public DateTime UploadedAt { get; set; }
    public bool IsMissing { get; set; }

    public WaterQuotaApplication Application { get; set; } = null!;
}
