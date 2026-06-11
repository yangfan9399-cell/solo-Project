package com.campus.dormrepair.enums;

public enum UserRole {
    STUDENT("学生"),
    DORM_MANAGER("宿管"),
    REPAIRMAN("维修工"),
    LOGISTICS_SUPERVISOR("后勤主管");

    private final String label;

    UserRole(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
