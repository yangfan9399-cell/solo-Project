package com.manufacturing.fixture.entity;

public enum FixtureStatus {
    AVAILABLE("可用"),
    BORROWED("借用中"),
    IN_MAINTENANCE("维修中"),
    IN_CALIBRATION("校准中"),
    SCRAPPED("已报废");

    private final String description;

    FixtureStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
