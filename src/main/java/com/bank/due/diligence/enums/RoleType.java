package com.bank.due.diligence.enums;

public enum RoleType {
    CUSTOMER_MANAGER("客户经理"),
    OPERATION_STAFF("运营人员"),
    RISK_CONTROL("风控人员"),
    SUPERVISOR("主管");

    private final String description;

    RoleType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
