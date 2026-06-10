
package com.example.cinema.entity;

public enum CompensationStatus {
    PENDING("待处理"),
    PROCESSING("处理中"),
    APPROVED("已审核"),
    REJECTED("已拒绝"),
    COMPLETED("已完成");

    private final String description;

    CompensationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
