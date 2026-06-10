
package com.example.petshipping.enums;

public enum HistoryType {
    BOOKING_CREATED("创建预约"),
    CERTIFICATE_SUBMITTED("提交检疫证明"),
    CERTIFICATE_VERIFIED("检疫审核通过"),
    CERTIFICATE_REJECTED("检疫审核拒绝"),
    CRATE_CHECKED("箱体检查"),
    CRATE_APPROVED("箱体确认"),
    CRATE_REJECTED("箱体不合规"),
    CHECKED_IN("航班交运"),
    FLIGHT_REBOOKED("航班改签"),
    BOOKING_CANCELLED("取消预约"),
    COMPLETED("运输完成");

    private final String description;

    HistoryType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
