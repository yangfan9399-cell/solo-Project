package com.bank.due.diligence.enums;

public enum ApplicationStatus {
    DRAFT("草稿"),
    PENDING_OPERATION("待运营核验"),
    MATERIAL_DEFICIENT("材料缺失待补正"),
    PENDING_RISK("待风险复核"),
    ADDRESS_VERIFICATION_FAILED("地址核验失败"),
    HIGH_RISK("高风险待复核"),
    PENDING_APPROVAL("待主管审批"),
    APPROVED("已开户"),
    REJECTED("已拒绝"),
    RETURNED("已退回");

    private final String description;

    ApplicationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
