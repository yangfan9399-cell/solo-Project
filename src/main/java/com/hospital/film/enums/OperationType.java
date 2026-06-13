package com.hospital.film.enums;

public enum OperationType {
    ACCEPT("受理申请"),
    PROCESS("业务处理"),
    SUPPLEMENT("补充材料"),
    SUBMIT_REVIEW("提交复核"),
    REVIEW_PASS("复核通过"),
    REVIEW_REJECT("复核退回"),
    ARCHIVE("归档"),
    REPROCESS("重新处理"),
    MODIFY_KEY_INFO("修改关键信息");

    private final String description;

    OperationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
