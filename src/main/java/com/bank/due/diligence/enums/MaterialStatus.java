package com.bank.due.diligence.enums;

public enum MaterialStatus {
    NOT_SUBMITTED("未提交"),
    SUBMITTED("已提交"),
    VERIFIED("已核验"),
    DEFICIENT("材料缺失"),
    EXPIRED("已过期");

    private final String description;

    MaterialStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
