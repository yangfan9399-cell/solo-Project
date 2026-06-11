package com.hotel.maintenance.enums;

public enum Role {
    RECEPTION("前台"),
    ENGINEER("工程师"),
    HOUSEKEEPING_SUPERVISOR("客房主管"),
    DUTY_MANAGER("值班经理");

    private final String description;

    Role(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
