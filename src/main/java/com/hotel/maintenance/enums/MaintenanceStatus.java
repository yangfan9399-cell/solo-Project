package com.hotel.maintenance.enums;

public enum MaintenanceStatus {
    SUBMITTED("已提交"),
    ASSIGNED("已派工"),
    IN_PROGRESS("维修中"),
    COMPLETED("维修完成"),
    OVERDUE("维修超期"),
    CLEANING_PENDING("待清洁检查"),
    CLEANING_FAILED("清洁未通过"),
    CLEANING_PASSED("清洁通过"),
    COMPLAINT_ESCALATED("客诉升级"),
    REJECTED("继续停卖"),
    RESTORED("恢复售卖");

    private final String description;

    MaintenanceStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
