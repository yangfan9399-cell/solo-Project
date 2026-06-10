package com.example.contract.enums;

public enum FailureReason {
    SMS_VERIFICATION_FAILED("短信验证失败"),
    IDENTITY_MISMATCH("签署人身份不符"),
    CONTRACT_REVOKED("合同撤回"),
    TIMEOUT("超时未签署"),
    OTHER("其他原因");

    private final String description;

    FailureReason(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}