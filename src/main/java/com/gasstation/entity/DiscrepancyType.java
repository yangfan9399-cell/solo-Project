package com.gasstation.entity;

public enum DiscrepancyType {
    NORMAL("盘点正常"),
    GAUGE_ERROR("液位仪异常"),
    DELIVERY_MISMATCH("配送量不符"),
    EXCESS_LOSS("损耗超标");

    private final String description;

    DiscrepancyType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
