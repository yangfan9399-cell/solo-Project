package com.fire.inspection.enums;

import lombok.Getter;

@Getter
public enum UserRole {
    INSPECTOR("巡查员"),
    DEPARTMENT_HEAD("责任部门"),
    SAFETY_DIRECTOR("安全主管");

    private final String displayName;

    UserRole(String displayName) {
        this.displayName = displayName;
    }
}
