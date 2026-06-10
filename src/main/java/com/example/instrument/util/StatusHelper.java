package com.example.instrument.util;

import com.example.instrument.entity.AbnormalRecord.AbnormalType;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;

public class StatusHelper {

    public static String getStatusText(PackageStatus status) {
        if (status == null) return "未知";
        return switch (status) {
            case PENDING_INVENTORY -> "待清点";
            case INVENTORY_COMPLETED -> "清点完成";
            case PENDING_STERILIZATION -> "待灭菌";
            case STERILIZATION_COMPLETED -> "灭菌完成";
            case PENDING_RECEIVE -> "待核收";
            case RECEIVED -> "已核收";
            case PENDING_REVIEW -> "待复核";
            case RELEASED -> "已放行";
            case ISSUED -> "已发放";
            case RETURNED -> "已退回";
            case ABNORMAL -> "异常";
        };
    }

    public static String getBadgeClass(PackageStatus status) {
        if (status == null) return "badge bg-secondary";
        return switch (status) {
            case PENDING_INVENTORY -> "badge bg-warning";
            case INVENTORY_COMPLETED, PENDING_STERILIZATION, STERILIZATION_COMPLETED, 
                 PENDING_RECEIVE, RECEIVED, PENDING_REVIEW -> "badge bg-info";
            case RELEASED -> "badge bg-success";
            case ISSUED -> "badge bg-primary";
            case RETURNED -> "badge bg-secondary";
            case ABNORMAL -> "badge bg-danger";
        };
    }

    public static String getAbnormalTypeText(AbnormalType type) {
        if (type == null) return "未知";
        return switch (type) {
            case INSTRUMENT_MISSING -> "器械缺失";
            case EXPIRED_STERILIZATION -> "灭菌过期";
            case RETURNED_FROM_OPERATING_ROOM -> "手术室退回";
            case DAMAGED_INSTRUMENT -> "器械损坏";
            case OTHER -> "其他异常";
        };
    }

    public static String getNodeIconClass(String type) {
        if (type == null) return "bg-secondary";
        return switch (type) {
            case "inventory" -> "bg-warning";
            case "sterilization" -> "bg-primary";
            case "receive" -> "bg-info";
            case "review" -> "bg-success";
            case "issue" -> "bg-success";
            default -> "bg-secondary";
        };
    }

    public static String getNodeIconColor(String type) {
        return "text-white";
    }

    public static String getNodeTitle(String type) {
        if (type == null) return "未知";
        return switch (type) {
            case "inventory" -> "器械清点";
            case "sterilization" -> "灭菌登记";
            case "receive" -> "核收确认";
            case "review" -> "质控复核";
            case "issue" -> "发放出库";
            default -> type;
        };
    }

    public static String getResultText(String result) {
        if (result == null) return "-";
        return switch (result) {
            case "NORMAL", "ACCEPTED", "APPROVED" -> "通过";
            case "MISSING", "REJECTED" -> "未通过";
            case "EXTRA" -> "多余";
            default -> result;
        };
    }
}