package com.hospital.film.enums;

public enum ApplicationStatus {
    ACCEPTED("已受理"),
    PROCESSING("处理中"),
    REVIEWING("复核中"),
    ARCHIVED("已归档"),
    REJECTED("已退回");

    private final String description;

    ApplicationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
