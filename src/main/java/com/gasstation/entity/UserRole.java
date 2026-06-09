package com.gasstation.entity;

public enum UserRole {
    STATION_MANAGER("站长"),
    GAUGER("计量员"),
    REGIONAL_SUPERVISOR("区域主管");

    private final String description;

    UserRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
