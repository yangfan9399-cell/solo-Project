package com.manufacturing.fixture.entity;

public enum BorrowStatus {
    PENDING_OUT("待出库"),
    BORROWED("借用中"),
    OVERDUE("借用超期"),
    PENDING_RETURN("待归还审核"),
    RETURNED_NORMAL("正常归还"),
    RETURNED_DAMAGED("损坏归还"),
    CANCELLED("已取消");

    private final String description;

    BorrowStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
