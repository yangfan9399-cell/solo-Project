package com.example.coldchain.enums;

public enum WaybillStatus {
    PENDING("待运输"),
    IN_TRANSIT("运输中"),
    ARRIVED("已到达"),
    SIGNED("已签收"),
    EXCEPTION("异常"),
    COMPENSATION_PENDING("待赔付审核"),
    COMPENSATION_APPROVED("赔付已通过"),
    COMPENSATION_REJECTED("赔付已拒绝");

    private final String description;

    WaybillStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}