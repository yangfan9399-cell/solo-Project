package com.manufacturing.fixture.entity;

public enum CalibrationResult {
    PASSED("合格"),
    FAILED("不合格");

    private final String description;

    CalibrationResult(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
