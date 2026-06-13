using System.ComponentModel.DataAnnotations;

namespace BunkerFuelSystem.Models;

public enum ApplicationCategory
{
    [Display(Name = "正常放行")]
    NormalPass = 0,

    [Display(Name = "指标超限")]
    IndicatorOverLimit = 1,

    [Display(Name = "现场证据缺失")]
    EvidenceMissing = 2,

    [Display(Name = "审批超时")]
    ApprovalTimeout = 3
}

public enum WorkflowStatus
{
    [Display(Name = "已受理")]
    Received = 0,

    [Display(Name = "处理中")]
    Processing = 1,

    [Display(Name = "复核中")]
    UnderReview = 2,

    [Display(Name = "已归档")]
    Archived = 3
}

public enum UserRole
{
    [Display(Name = "现场人员")]
    OnSitePersonnel = 0,

    [Display(Name = "主管复核人")]
    SupervisorReviewer = 1
}

public enum NodeType
{
    [Display(Name = "受理")]
    Received = 0,

    [Display(Name = "处理")]
    Processing = 1,

    [Display(Name = "复核")]
    Review = 2,

    [Display(Name = "归档")]
    Archive = 3,

    [Display(Name = "退回")]
    Rejection = 4,

    [Display(Name = "重新处理")]
    Reprocess = 5
}
