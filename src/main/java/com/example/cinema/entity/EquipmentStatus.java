
package com.example.cinema.entity;

public enum EquipmentStatus {
    NORMAL("正常"),
    ABNORMAL("异常"),
    FAULT("故障"),
    REPAIRING("维修中"),
    UNKNOWN("未知");

    private final String description;

    EquipmentStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
