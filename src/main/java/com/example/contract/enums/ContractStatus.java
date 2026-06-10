package com.example.contract.enums;

public enum ContractStatus {
    DRAFT("草稿"),
    PENDING("待签署"),
    SIGNED("已签署"),
    FAILED("签署失败"),
    REVOKED("已撤回"),
    EVIDENCE_PRESERVED("证据已保全");

    private final String description;

    ContractStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}