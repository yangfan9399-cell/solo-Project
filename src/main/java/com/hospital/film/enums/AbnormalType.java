package com.hospital.film.enums;

public enum AbnormalType {
    NORMAL("正常"),
    MATERIAL_MISSING("关键材料缺失"),
    RESPONSIBILITY_MISMATCH("责任对象不一致"),
    REVIEW_REJECTED("复核退回");

    private final String description;

    AbnormalType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
