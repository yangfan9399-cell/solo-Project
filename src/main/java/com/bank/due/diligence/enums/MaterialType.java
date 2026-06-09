package com.bank.due.diligence.enums;

public enum MaterialType {
    BUSINESS_LICENSE("营业执照"),
    ORG_CODE_CERT("组织机构代码证"),
    TAX_REG_CERT("税务登记证"),
    LEGAL_ID_CARD("法人身份证"),
    LEGAL_ID_CARD_BACK("法人身份证背面"),
    BENEFICIARY_ID_CARD("受益人身份证"),
    BENEFICIARY_PROOF("受益所有人证明"),
    ADDRESS_PROOF("经营地址证明"),
    ARTICLES_OF_ASSOCIATION("公司章程"),
    BOARD_RESOLUTION("董事会决议"),
    FINANCIAL_REPORT("财务报表"),
    BANK_STATEMENT("银行流水"),
    POWER_OF_ATTORNEY("授权委托书"),
    OTHER("其他材料");

    private final String description;

    MaterialType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
