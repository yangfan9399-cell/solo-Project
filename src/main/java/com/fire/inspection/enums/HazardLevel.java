package com.fire.inspection.enums;

import lombok.Getter;

@Getter
public enum HazardLevel {
    LOW("低"),
    MEDIUM("中"),
    HIGH("高"),
    CRITICAL("重大");

    private final String displayName;

    HazardLevel(String displayName) {
        this.displayName = displayName;
    }
}
