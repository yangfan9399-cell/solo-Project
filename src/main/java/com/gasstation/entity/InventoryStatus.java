package com.gasstation.entity;

public enum InventoryStatus {
    PENDING_REVIEW("待复核"),
    REVIEWED("已复核"),
    REJECTED("已驳回"),
    PENDING_DISPOSAL("待处置"),
    ADJUSTED("已调整"),
    INVESTIGATING("追查中"),
    ARCHIVED("已归档");

    private final String description;

    InventoryStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
