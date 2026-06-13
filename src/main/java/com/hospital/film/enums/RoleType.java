package com.hospital.film.enums;

public enum RoleType {
    OPERATOR("经办人"),
    REVIEWER("复核人"),
    ADMIN("管理员");

    private final String description;

    RoleType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
