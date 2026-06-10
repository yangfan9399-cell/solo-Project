package com.example.contract.enums;

public enum UserRole {
    OPERATOR("业务经办人"),
    SIGNER("签署人"),
    LEGAL("法务"),
    ARCHIVIST("档案员"),
    ADMIN("管理员");

    private final String description;

    UserRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}