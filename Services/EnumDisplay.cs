using MeetingRoomEquipment.Models;

namespace MeetingRoomEquipment.Services;

public static class EnumDisplay
{
    public static string GetStatusText(RecordStatus status) => status switch
    {
        RecordStatus.PendingAcceptance => "待受理",
        RecordStatus.Processing => "处理中",
        RecordStatus.PendingReview => "待复核",
        RecordStatus.ReturnedForSupplement => "退回补证",
        RecordStatus.Archived => "已归档",
        RecordStatus.Rejected => "已驳回",
        _ => "未知"
    };

    public static string GetStatusBadgeClass(RecordStatus status) => status switch
    {
        RecordStatus.PendingAcceptance => "bg-secondary text-white",
        RecordStatus.Processing => "bg-primary text-white",
        RecordStatus.PendingReview => "bg-warning text-dark",
        RecordStatus.ReturnedForSupplement => "bg-danger text-white",
        RecordStatus.Archived => "bg-success text-white",
        RecordStatus.Rejected => "bg-dark text-white",
        _ => "bg-light text-dark"
    };

    public static string GetCategoryText(SampleCategory cat) => cat switch
    {
        SampleCategory.NormalRelease => "正常放行",
        SampleCategory.MetricExceeded => "指标超限",
        SampleCategory.EvidenceMissing => "证据缺失",
        SampleCategory.ApprovalTimeout => "审批超时",
        _ => "未知"
    };

    public static string GetCategoryBadgeClass(SampleCategory cat) => cat switch
    {
        SampleCategory.NormalRelease => "bg-success text-white",
        SampleCategory.MetricExceeded => "bg-danger text-white",
        SampleCategory.EvidenceMissing => "bg-warning text-dark",
        SampleCategory.ApprovalTimeout => "bg-orange text-white",
        _ => "bg-light text-dark"
    };

    public static string GetNodeTypeText(NodeType t) => t switch
    {
        NodeType.Acceptance => "受理",
        NodeType.ProcessUpdate => "处理更新",
        NodeType.Review => "复核",
        NodeType.ReturnSupplement => "退回补证",
        NodeType.Archive => "归档",
        NodeType.Reopen => "重新处理",
        _ => "未知"
    };

    public static string GetRoleText(UserRole r) => r switch
    {
        UserRole.FieldStaff => "现场人员",
        UserRole.Reviewer => "主管复核人",
        UserRole.Admin => "系统管理员",
        _ => "未知"
    };

    public static string GetEvidenceTypeText(EvidenceType t) => t switch
    {
        EvidenceType.Photo => "照片",
        EvidenceType.Video => "视频",
        EvidenceType.Document => "文档",
        EvidenceType.SignForm => "签字表单",
        _ => "未知"
    };
}
