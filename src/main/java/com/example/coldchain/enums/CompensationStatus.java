package com.example.coldchain.enums;

public enum CompensationStatus {
    PENDING("待审核"),
    ASSESSED("已评估"),
    APPROVED("已通过"),
    REJECTED("已拒绝");

    private final String description;

    CompensationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}