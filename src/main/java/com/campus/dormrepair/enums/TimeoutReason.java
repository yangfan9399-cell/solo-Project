package com.campus.dormrepair.enums;

public enum TimeoutReason {
    PARTS_DELAY("配件延迟"),
    PERSONNEL_SHORTAGE("人员不足"),
    COMPLEX_FAULT("故障复杂"),
    COORDINATION_ISSUE("协调问题"),
    OTHER("其他");

    private final String label;

    TimeoutReason(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
