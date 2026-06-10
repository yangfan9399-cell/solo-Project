package com.example.coldchain.enums;

public enum DisposalStatus {
    PENDING("待处置"),
    PROCESSING("处置中"),
    COMPLETED("已完成"),
    REJECTED("已驳回");

    private final String description;

    DisposalStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}