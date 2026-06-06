package com.manufacturing.fixture.entity;

public enum QualityResult {
    USABLE("可用"),
    NEED_REPAIR("需维修"),
    SCRAP("报废");

    private final String description;

    QualityResult(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
