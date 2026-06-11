package com.campus.dormrepair.enums;

public enum RepairStatus {
    SUBMITTED("已提交"),
    ASSIGNED("已派单"),
    IN_PROGRESS("维修中"),
    PARTS_SHORTAGE("配件缺货"),
    TIMEOUT("维修超时"),
    COMPLETED("维修完成"),
    REVIEWED("已回访"),
    CLOSED("已关闭"),
    DISSATISFIED("学生不满意");

    private final String label;

    RepairStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
