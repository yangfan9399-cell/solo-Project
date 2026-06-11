package com.hotel.maintenance.dto;

import com.hotel.maintenance.entity.MaintenanceOrder;
import lombok.Data;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
public class MaintenanceOrderListVo {
    private Long id;
    private String orderNo;
    private String roomNumber;
    private String roomFloorType;
    private String faultTypeDesc;
    private String status;
    private String statusClass;
    private String statusDesc;
    private String reporterName;
    private String engineerName;
    private String outageDuration;
    private boolean outageFinished;
    private String createdAtStr;

    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter DATE_TIME_FMT_SHORT = DateTimeFormatter.ofPattern("MM-dd HH:mm");

    public static MaintenanceOrderListVo from(MaintenanceOrder order) {
        MaintenanceOrderListVo vo = new MaintenanceOrderListVo();
        vo.setId(order.getId());
        vo.setOrderNo(order.getOrderNo());
        vo.setRoomNumber(order.getRoom().getRoomNumber());
        vo.setRoomFloorType(order.getRoom().getFloor() + "F / " + order.getRoom().getRoomType());
        vo.setFaultTypeDesc(order.getFaultType().getDescription());
        vo.setStatus(order.getStatus().name());
        vo.setStatusClass("bg-" + order.getStatus().name().toLowerCase());
        vo.setStatusDesc(order.getStatus().getDescription());
        vo.setReporterName(order.getReporter().getName());
        vo.setEngineerName(order.getEngineer() != null ? order.getEngineer().getName() : "-");
        vo.setCreatedAtStr(order.getCreatedAt().format(DATE_TIME_FMT));

        LocalDateTime start = order.getOutOfServiceTime();
        LocalDateTime end = order.getRestoreTime() != null ? order.getRestoreTime() : LocalDateTime.now();
        long hours = Duration.between(start, end).toHours();
        vo.setOutageDuration(hours + "h");
        vo.setOutageFinished(order.getRestoreTime() != null);
        return vo;
    }
}
