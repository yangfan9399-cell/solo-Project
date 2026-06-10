
package com.example.petshipping.enums;

public enum BookingStatus {
    PENDING("待审核"),
    CERTIFICATE_VERIFIED("检疫已审核"),
    CRATE_APPROVED("箱体已确认"),
    CHECKED_IN("已交运"),
    COMPLETED("已完成"),
    CERTIFICATE_EXPIRED("证明过期"),
    CRATE_REJECTED("箱体不合规"),
    CANCELLED("已取消"),
    REBOOKING("改签中");

    private final String description;

    BookingStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
