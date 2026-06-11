package com.hotel.maintenance.dto;

import com.hotel.maintenance.entity.*;
import lombok.Data;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Data
public class MaintenanceOrderDetailVo {
    private Long id;
    private String orderNo;
    private String roomNumber;
    private Integer roomFloor;
    private String roomType;
    private Integer roomCapacity;
    private String roomPriceStr;
    private String roomLocation;
    private String roomStatus;
    private String roomStatusClass;
    private String roomStatusDesc;
    private String faultTypeDesc;
    private String faultDescription;
    private String status;
    private String statusClass;
    private String statusDesc;
    private String reporterName;
    private String reporterRoleDesc;
    private String createdAtStr;
    private String outOfServiceTimeStr;
    private String outOfServiceTimeShort;
    private long outageHours;

    private boolean hasEngineer;
    private String engineerName;
    private String estimatedRepairTimeStr;
    private String actualRepairStartTimeStr;
    private String actualRepairEndTimeStr;
    private String repairReport;

    private List<MaintenanceRecordVo> records = new ArrayList<>();

    private boolean hasHousekeeper;
    private String housekeeperName;
    private String housekeeperRoleDesc;
    private String cleaningCheckTimeStr;
    private String cleaningReport;
    private String cleaningStatusClass;
    private String cleaningStatusText;

    private boolean hasReviewer;
    private String reviewerName;
    private String reviewerRoleDesc;
    private String reviewTimeStr;
    private String reviewComment;
    private String reviewStatusClass;
    private String reviewStatusText;
    private String restoreTimeStr;

    private boolean complaint;
    private String complaintDescription;

    private List<AffectedOrderVo> affectedOrders = new ArrayList<>();
    private List<AuditNodeVo> auditNodes = new ArrayList<>();

    private boolean canRestore;
    private boolean showReviewPanel;
    private boolean showAssignPanel;
    private boolean showStartRepairPanel;
    private boolean showCompleteRepairPanel;
    private boolean showCleaningCheckPanel;
    private boolean showEscalateComplaint;
    private boolean showAddAffectedOrder;
    private boolean showOverdueAlert;

    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter DATE_TIME_FMT_SS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE_TIME_SHORT = DateTimeFormatter.ofPattern("MM-dd HH:mm");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_SHORT = DateTimeFormatter.ofPattern("MM-dd");

    public static MaintenanceOrderDetailVo from(MaintenanceOrder order, boolean canRestore) {
        MaintenanceOrderDetailVo vo = new MaintenanceOrderDetailVo();
        Room r = order.getRoom();
        vo.setId(order.getId());
        vo.setOrderNo(order.getOrderNo());
        vo.setRoomNumber(r.getRoomNumber());
        vo.setRoomFloor(r.getFloor());
        vo.setRoomType(r.getRoomType());
        vo.setRoomCapacity(r.getCapacity());
        vo.setRoomPriceStr("¥" + String.format("%.2f", r.getPricePerNight()) + "/晚");
        vo.setRoomLocation(r.getLocation());
        vo.setRoomStatus(r.getStatus().name());
        vo.setRoomStatusClass("bg-" + r.getStatus().name().toLowerCase());
        vo.setRoomStatusDesc(r.getStatus().getDescription());

        vo.setFaultTypeDesc(order.getFaultType().getDescription());
        vo.setFaultDescription(order.getFaultDescription());
        vo.setStatus(order.getStatus().name());
        vo.setStatusClass("bg-" + order.getStatus().name().toLowerCase());
        vo.setStatusDesc(order.getStatus().getDescription());
        vo.setReporterName(order.getReporter().getName());
        vo.setReporterRoleDesc(order.getReporter().getRole().getDescription());
        vo.setCreatedAtStr(order.getCreatedAt().format(DATE_TIME_FMT_SS));
        vo.setOutOfServiceTimeStr(order.getOutOfServiceTime().format(DATE_TIME_FMT_SS));
        vo.setOutOfServiceTimeShort(order.getOutOfServiceTime().format(DATE_TIME_SHORT));

        long hours = java.time.Duration.between(order.getOutOfServiceTime(),
                order.getRestoreTime() != null ? order.getRestoreTime() : java.time.LocalDateTime.now()).toHours();
        vo.setOutageHours(hours);

        vo.setHasEngineer(order.getEngineer() != null);
        if (order.getEngineer() != null) {
            vo.setEngineerName(order.getEngineer().getName());
        }
        vo.setEstimatedRepairTimeStr(order.getEstimatedRepairTime() != null ? order.getEstimatedRepairTime().format(DATE_TIME_FMT) : "-");
        vo.setActualRepairStartTimeStr(order.getActualRepairStartTime() != null ? order.getActualRepairStartTime().format(DATE_TIME_FMT) : "-");
        vo.setActualRepairEndTimeStr(order.getActualRepairEndTime() != null ? order.getActualRepairEndTime().format(DATE_TIME_FMT) : "-");
        vo.setRepairReport(order.getRepairReport() != null ? order.getRepairReport() : "暂无");

        vo.setHasHousekeeper(order.getHousekeeper() != null);
        if (order.getHousekeeper() != null) {
            vo.setHousekeeperName(order.getHousekeeper().getName());
            vo.setHousekeeperRoleDesc(order.getHousekeeper().getRole().getDescription());
        }
        vo.setCleaningCheckTimeStr(order.getCleaningCheckTime() != null ? order.getCleaningCheckTime().format(DATE_TIME_FMT) : "-");
        vo.setCleaningReport(order.getCleaningReport() != null ? order.getCleaningReport() : "暂无");

        String cs = order.getStatus().name();
        if ("CLEANING_PASSED".equals(cs)) {
            vo.setCleaningStatusClass("bg-success");
            vo.setCleaningStatusText("清洁通过");
        } else if ("CLEANING_FAILED".equals(cs)) {
            vo.setCleaningStatusClass("bg-danger");
            vo.setCleaningStatusText("清洁未通过");
        } else {
            vo.setCleaningStatusClass("bg-warning");
            vo.setCleaningStatusText("待清洁");
        }

        vo.setHasReviewer(order.getReviewer() != null);
        if (order.getReviewer() != null) {
            vo.setReviewerName(order.getReviewer().getName());
            vo.setReviewerRoleDesc(order.getReviewer().getRole().getDescription());
        }
        vo.setReviewTimeStr(order.getReviewTime() != null ? order.getReviewTime().format(DATE_TIME_FMT) : "-");
        vo.setReviewComment(order.getReviewComment() != null ? order.getReviewComment() : "暂无");
        vo.setRestoreTimeStr(order.getRestoreTime() != null ? order.getRestoreTime().format(DATE_TIME_FMT) : "-");

        if ("RESTORED".equals(cs)) {
            vo.setReviewStatusClass("bg-success");
            vo.setReviewStatusText("恢复售卖");
        } else if ("REJECTED".equals(cs)) {
            vo.setReviewStatusClass("bg-danger");
            vo.setReviewStatusText("继续停卖");
        }

        vo.setComplaint(Boolean.TRUE.equals(order.getComplaint()));
        vo.setComplaintDescription(order.getComplaintDescription());
        vo.setCanRestore(canRestore);

        vo.setShowAssignPanel("SUBMITTED".equals(cs));
        vo.setShowStartRepairPanel("ASSIGNED".equals(cs));
        vo.setShowCompleteRepairPanel("IN_PROGRESS".equals(cs));
        vo.setShowCleaningCheckPanel("COMPLETED".equals(cs) || "OVERDUE".equals(cs) || "CLEANING_FAILED".equals(cs));
        vo.setShowReviewPanel("COMPLETED".equals(cs) || "OVERDUE".equals(cs) || "CLEANING_FAILED".equals(cs)
                || "CLEANING_PASSED".equals(cs) || "COMPLAINT_ESCALATED".equals(cs));
        vo.setShowEscalateComplaint(!"COMPLAINT_ESCALATED".equals(cs) && !"RESTORED".equals(cs) && !"REJECTED".equals(cs));
        vo.setShowAddAffectedOrder(!"RESTORED".equals(cs) && !"REJECTED".equals(cs));
        vo.setShowOverdueAlert("OVERDUE".equals(cs));

        return vo;
    }

    public void setMaintenanceRecords(List<MaintenanceRecord> records) {
        for (MaintenanceRecord r : records) {
            MaintenanceRecordVo rv = new MaintenanceRecordVo();
            rv.setWorkStartTimeStr(r.getWorkStartTime() != null ? r.getWorkStartTime().format(TIME_FMT) : "-");
            rv.setWorkEndTimeStr(r.getWorkEndTime() != null ? r.getWorkEndTime().format(TIME_FMT) : "进行中");
            rv.setWorkDescription(r.getWorkDescription() != null ? r.getWorkDescription() : "-");
            rv.setPartsUsed(r.getPartsUsed() != null ? r.getPartsUsed() : "-");
            rv.setLaborCostStr(r.getLaborCost() != null ? "¥" + r.getLaborCost() : "-");
            rv.setPartsCostStr(r.getPartsCost() != null ? "¥" + r.getPartsCost() : "-");
            this.records.add(rv);
        }
    }

    public void setAffectedOrders(List<AffectedOrder> orders) {
        for (AffectedOrder o : orders) {
            AffectedOrderVo av = new AffectedOrderVo();
            av.setOrderNo(o.getOrderNo());
            av.setGuestName(o.getGuestName());
            av.setCheckInOutStr(o.getCheckInDate().format(DATE_SHORT) + " ~ " + o.getCheckOutDate().format(DATE_SHORT));
            av.setOrderAmountStr(o.getOrderAmount() != null ? "¥" + String.format("%.2f", o.getOrderAmount()) : "-");
            av.setHandlingMethod(o.getHandlingMethod());
            av.setCompensationAmountStr(o.getCompensationAmount() != null ? "¥" + String.format("%.2f", o.getCompensationAmount()) : "-");
            av.setRemark(o.getRemark());
            this.affectedOrders.add(av);
        }
    }

    public void setAuditNodes(List<AuditNode> nodes) {
        for (AuditNode n : nodes) {
            AuditNodeVo nv = new AuditNodeVo();
            nv.setStatus(n.getStatus().name());
            nv.setStatusClass("bg-" + n.getStatus().name().toLowerCase());
            nv.setStatusDesc(n.getStatus().getDescription());
            nv.setOperatorRoleDesc(n.getOperatorRole().getDescription());
            nv.setOperatorName(n.getOperator().getName());
            nv.setCreatedAtStr(n.getCreatedAt().format(DATE_TIME_FMT_SS));
            nv.setComment(n.getComment());
            this.auditNodes.add(nv);
        }
    }

    @Data
    public static class MaintenanceRecordVo {
        private String workStartTimeStr;
        private String workEndTimeStr;
        private String workDescription;
        private String partsUsed;
        private String laborCostStr;
        private String partsCostStr;
    }

    @Data
    public static class AffectedOrderVo {
        private String orderNo;
        private String guestName;
        private String checkInOutStr;
        private String orderAmountStr;
        private String handlingMethod;
        private String compensationAmountStr;
        private String remark;
    }

    @Data
    public static class AuditNodeVo {
        private String status;
        private String statusClass;
        private String statusDesc;
        private String operatorRoleDesc;
        private String operatorName;
        private String createdAtStr;
        private String comment;
    }
}
