package com.hotel.maintenance.enums;

public enum RoomStatus {
    AVAILABLE("可售卖"),
    OUT_OF_SERVICE("故障停卖"),
    UNDER_REPAIR("维修中"),
    CLEANING_PENDING("待清洁"),
    CLEANING_DONE("清洁完成"),
    REVIEW_PENDING("待复核");

    private final String description;

    RoomStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
