package com.fire.inspection.enums;

import lombok.Getter;

@Getter
public enum HazardStatus {
    REGISTERED("待整改"),
    RECTIFYING("整改中"),
    RECTIFIED("待验收"),
    ACCEPTED("已销项"),
    REJECTED("验收退回"),
    OVERDUE("整改超期");

    private final String displayName;

    HazardStatus(String displayName) {
        this.displayName = displayName;
    }
}
