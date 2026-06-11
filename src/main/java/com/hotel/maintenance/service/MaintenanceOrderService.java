package com.hotel.maintenance.service;

import com.hotel.maintenance.dto.StatisticsDto;
import com.hotel.maintenance.entity.*;
import com.hotel.maintenance.enums.*;
import com.hotel.maintenance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceOrderService {

    private final MaintenanceOrderRepository maintenanceOrderRepository;
    private final RoomRepository roomRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditNodeRepository auditNodeRepository;
    private final AffectedOrderRepository affectedOrderRepository;
    private final MaintenanceRecordRepository maintenanceRecordRepository;

    @Transactional
    public MaintenanceOrder submitFault(Long roomId, FaultType faultType, String description, Long reporterId) {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new IllegalArgumentException("房间不存在"));
        Employee reporter = employeeRepository.findById(reporterId).orElseThrow(() -> new IllegalArgumentException("员工不存在"));

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new IllegalStateException("房间当前状态不允许提交故障");
        }

        MaintenanceOrder order = new MaintenanceOrder();
        order.setOrderNo(generateOrderNo());
        order.setRoom(room);
        order.setFaultType(faultType);
        order.setFaultDescription(description);
        order.setStatus(MaintenanceStatus.SUBMITTED);
        order.setReporter(reporter);
        order.setOutOfServiceTime(LocalDateTime.now());
        order.setPriority(1);

        room.setStatus(RoomStatus.OUT_OF_SERVICE);
        roomRepository.save(room);

        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        addAuditNode(savedOrder, MaintenanceStatus.SUBMITTED, reporter, "前台提交故障，房间停卖");

        return savedOrder;
    }

    @Transactional
    public MaintenanceOrder assignEngineer(Long orderId, Long engineerId, LocalDateTime estimatedTime) {
        MaintenanceOrder order = maintenanceOrderRepository.findById(orderId).orElseThrow(() -> new IllegalArgumentException("工单不存在"));
        Employee engineer = employeeRepository.findById(engineerId).orElseThrow(() -> new IllegalArgumentException("工程师不存在"));

        if (order.getStatus() != MaintenanceStatus.SUBMITTED) {
            throw new IllegalStateException("当前状态不允许派工");
        }

        order.setEngineer(engineer);
        order.setStatus(MaintenanceStatus.ASSIGNED);
        order.setEstimatedRepairTime(estimatedTime);

        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        addAuditNode(savedOrder, MaintenanceStatus.ASSIGNED, engineer, "已派工，预计维修完成时间：" + estimatedTime);

        return savedOrder;
    }

    @Transactional
    public MaintenanceOrder startRepair(Long orderId) {
        MaintenanceOrder order = maintenanceOrderRepository.findById(orderId).orElseThrow(() -> new IllegalArgumentException("工单不存在"));

        if (order.getStatus() != MaintenanceStatus.ASSIGNED) {
            throw new IllegalStateException("当前状态不允许开始维修");
        }

        order.setStatus(MaintenanceStatus.IN_PROGRESS);
        order.setActualRepairStartTime(LocalDateTime.now());

        order.getRoom().setStatus(RoomStatus.UNDER_REPAIR);
        roomRepository.save(order.getRoom());

        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        addAuditNode(savedOrder, MaintenanceStatus.IN_PROGRESS, order.getEngineer(), "开始维修");

        MaintenanceRecord record = new MaintenanceRecord();
        record.setMaintenanceOrder(savedOrder);
        record.setEngineer(order.getEngineer());
        record.setWorkStartTime(LocalDateTime.now());
        record.setWorkStatus("进行中");
        maintenanceRecordRepository.save(record);

        return savedOrder;
    }

    @Transactional
    public MaintenanceOrder completeRepair(Long orderId, String repairReport, Double laborCost, Double partsCost, String partsUsed) {
        MaintenanceOrder order = maintenanceOrderRepository.findById(orderId).orElseThrow(() -> new IllegalArgumentException("工单不存在"));

        if (order.getStatus() != MaintenanceStatus.IN_PROGRESS) {
            throw new IllegalStateException("当前状态不允许完成维修");
        }

        order.setStatus(MaintenanceStatus.COMPLETED);
        order.setActualRepairEndTime(LocalDateTime.now());
        order.setRepairReport(repairReport);

        if (order.getEstimatedRepairTime() != null && LocalDateTime.now().isAfter(order.getEstimatedRepairTime())) {
            order.setStatus(MaintenanceStatus.OVERDUE);
        }

        order.getRoom().setStatus(RoomStatus.CLEANING_PENDING);
        roomRepository.save(order.getRoom());

        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        List<MaintenanceRecord> records = maintenanceRecordRepository.findByMaintenanceOrderIdOrderByCreatedAtDesc(orderId);
        if (!records.isEmpty()) {
            MaintenanceRecord record = records.get(0);
            record.setWorkEndTime(LocalDateTime.now());
            record.setWorkDescription(repairReport);
            record.setLaborCost(laborCost);
            record.setPartsCost(partsCost);
            record.setPartsUsed(partsUsed);
            record.setWorkStatus("已完成");
            maintenanceRecordRepository.save(record);
        }

        MaintenanceStatus status = order.getStatus() == MaintenanceStatus.OVERDUE ? MaintenanceStatus.OVERDUE : MaintenanceStatus.COMPLETED;
        addAuditNode(savedOrder, status, order.getEngineer(), "维修完成：" + repairReport);

        return savedOrder;
    }

    @Transactional
    public MaintenanceOrder checkCleaning(Long orderId, Long housekeeperId, boolean passed, String cleaningReport) {
        MaintenanceOrder order = maintenanceOrderRepository.findById(orderId).orElseThrow(() -> new IllegalArgumentException("工单不存在"));
        Employee housekeeper = employeeRepository.findById(housekeeperId).orElseThrow(() -> new IllegalArgumentException("客房主管不存在"));

        if (order.getStatus() != MaintenanceStatus.COMPLETED && order.getStatus() != MaintenanceStatus.OVERDUE && order.getStatus() != MaintenanceStatus.CLEANING_FAILED) {
            throw new IllegalStateException("当前状态不允许进行清洁检查");
        }

        order.setHousekeeper(housekeeper);
        order.setCleaningCheckTime(LocalDateTime.now());
        order.setCleaningReport(cleaningReport);

        if (passed) {
            order.setStatus(MaintenanceStatus.CLEANING_PASSED);
            order.getRoom().setStatus(RoomStatus.CLEANING_DONE);
        } else {
            order.setStatus(MaintenanceStatus.CLEANING_FAILED);
            order.getRoom().setStatus(RoomStatus.CLEANING_PENDING);
        }
        roomRepository.save(order.getRoom());

        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        MaintenanceStatus status = passed ? MaintenanceStatus.CLEANING_PASSED : MaintenanceStatus.CLEANING_FAILED;
        addAuditNode(savedOrder, status, housekeeper, "清洁检查" + (passed ? "通过" : "未通过") + "：" + cleaningReport);

        return savedOrder;
    }

    @Transactional
    public MaintenanceOrder escalateComplaint(Long orderId, String complaintDescription) {
        MaintenanceOrder order = maintenanceOrderRepository.findById(orderId).orElseThrow(() -> new IllegalArgumentException("工单不存在"));

        order.setComplaint(true);
        order.setComplaintDescription(complaintDescription);
        order.setStatus(MaintenanceStatus.COMPLAINT_ESCALATED);

        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        Employee dutyManager = employeeRepository.findByRole(Role.DUTY_MANAGER).stream().findFirst().orElse(null);
        if (dutyManager != null) {
            addAuditNode(savedOrder, MaintenanceStatus.COMPLAINT_ESCALATED, dutyManager, "客诉升级：" + complaintDescription);
        }

        return savedOrder;
    }

    @Transactional
    public MaintenanceOrder reviewRestore(Long orderId, Long reviewerId, boolean restore, String reviewComment) {
        MaintenanceOrder order = maintenanceOrderRepository.findById(orderId).orElseThrow(() -> new IllegalArgumentException("工单不存在"));
        Employee reviewer = employeeRepository.findById(reviewerId).orElseThrow(() -> new IllegalArgumentException("值班经理不存在"));

        if (order.getStatus() != MaintenanceStatus.CLEANING_PASSED && order.getStatus() != MaintenanceStatus.COMPLAINT_ESCALATED) {
            throw new IllegalStateException("当前状态不允许复核");
        }

        if (restore) {
            boolean cleaningPassed = order.getStatus() == MaintenanceStatus.CLEANING_PASSED;
            if (!cleaningPassed) {
                List<AuditNode> nodes = auditNodeRepository.findByMaintenanceOrderIdOrderByCreatedAt(orderId);
                cleaningPassed = nodes.stream()
                        .anyMatch(node -> node.getStatus() == MaintenanceStatus.CLEANING_PASSED);
            }
            if (!cleaningPassed) {
                throw new IllegalStateException("清洁未通过，禁止恢复售卖");
            }
        }

        order.setReviewer(reviewer);
        order.setReviewTime(LocalDateTime.now());
        order.setReviewComment(reviewComment);

        if (restore) {
            order.setStatus(MaintenanceStatus.RESTORED);
            order.setRestoreTime(LocalDateTime.now());
            order.getRoom().setStatus(RoomStatus.AVAILABLE);
        } else {
            order.setStatus(MaintenanceStatus.REJECTED);
        }
        roomRepository.save(order.getRoom());

        MaintenanceOrder savedOrder = maintenanceOrderRepository.save(order);

        MaintenanceStatus status = restore ? MaintenanceStatus.RESTORED : MaintenanceStatus.REJECTED;
        addAuditNode(savedOrder, status, reviewer, (restore ? "恢复售卖" : "继续停卖") + "：" + reviewComment);

        return savedOrder;
    }

    private void addAuditNode(MaintenanceOrder order, MaintenanceStatus status, Employee operator, String comment) {
        AuditNode node = new AuditNode();
        node.setMaintenanceOrder(order);
        node.setStatus(status);
        node.setOperatorRole(operator.getRole());
        node.setOperator(operator);
        node.setComment(comment);
        auditNodeRepository.save(node);
    }

    private String generateOrderNo() {
        return "MT" + System.currentTimeMillis();
    }

    public List<MaintenanceOrder> findAll() {
        return maintenanceOrderRepository.findAll();
    }

    public MaintenanceOrder findById(Long id) {
        return maintenanceOrderRepository.findById(id).orElse(null);
    }

    public List<MaintenanceOrder> findByStatus(MaintenanceStatus status) {
        return maintenanceOrderRepository.findByStatus(status);
    }

    public List<AuditNode> getAuditNodes(Long orderId) {
        return auditNodeRepository.findByMaintenanceOrderIdOrderByCreatedAt(orderId);
    }

    public List<AffectedOrder> getAffectedOrders(Long orderId) {
        return affectedOrderRepository.findByMaintenanceOrderId(orderId);
    }

    public List<MaintenanceRecord> getMaintenanceRecords(Long orderId) {
        return maintenanceRecordRepository.findByMaintenanceOrderIdOrderByCreatedAtDesc(orderId);
    }

    public void addAffectedOrder(AffectedOrder affectedOrder) {
        affectedOrderRepository.save(affectedOrder);
    }

    public long calculateOutageHours(MaintenanceOrder order) {
        LocalDateTime endTime = order.getRestoreTime() != null ? order.getRestoreTime() : LocalDateTime.now();
        return Duration.between(order.getOutOfServiceTime(), endTime).toHours();
    }

    public List<StatisticsDto> getStatisticsByFloor() {
        List<MaintenanceOrder> allOrders = maintenanceOrderRepository.findAll();
        Map<Integer, List<MaintenanceOrder>> grouped = allOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getRoom().getFloor()));

        List<StatisticsDto> result = new ArrayList<>();
        for (Map.Entry<Integer, List<MaintenanceOrder>> entry : grouped.entrySet()) {
            result.add(buildStatisticsDto(entry.getKey() + "楼", entry.getValue()));
        }
        return result;
    }

    public List<StatisticsDto> getStatisticsByRoomType() {
        List<MaintenanceOrder> allOrders = maintenanceOrderRepository.findAll();
        Map<String, List<MaintenanceOrder>> grouped = allOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getRoom().getRoomType()));

        List<StatisticsDto> result = new ArrayList<>();
        for (Map.Entry<String, List<MaintenanceOrder>> entry : grouped.entrySet()) {
            result.add(buildStatisticsDto(entry.getKey(), entry.getValue()));
        }
        return result;
    }

    public List<StatisticsDto> getStatisticsByFaultType() {
        List<MaintenanceOrder> allOrders = maintenanceOrderRepository.findAll();
        Map<FaultType, List<MaintenanceOrder>> grouped = allOrders.stream()
                .collect(Collectors.groupingBy(MaintenanceOrder::getFaultType));

        List<StatisticsDto> result = new ArrayList<>();
        for (Map.Entry<FaultType, List<MaintenanceOrder>> entry : grouped.entrySet()) {
            result.add(buildStatisticsDto(entry.getKey().getDescription(), entry.getValue()));
        }
        return result;
    }

    public List<StatisticsDto> getStatisticsByOutageDuration() {
        List<MaintenanceOrder> allOrders = maintenanceOrderRepository.findAll();
        Map<String, List<MaintenanceOrder>> grouped = allOrders.stream()
                .collect(Collectors.groupingBy(this::getDurationGroup));

        List<StatisticsDto> result = new ArrayList<>();
        for (Map.Entry<String, List<MaintenanceOrder>> entry : grouped.entrySet()) {
            result.add(buildStatisticsDto(entry.getKey(), entry.getValue()));
        }
        return result;
    }

    private String getDurationGroup(MaintenanceOrder order) {
        long hours = calculateOutageHours(order);
        if (hours < 4) return "0-4小时";
        if (hours < 12) return "4-12小时";
        if (hours < 24) return "12-24小时";
        if (hours < 48) return "24-48小时";
        return "48小时以上";
    }

    private StatisticsDto buildStatisticsDto(String groupName, List<MaintenanceOrder> orders) {
        StatisticsDto dto = new StatisticsDto();
        dto.setGroupName(groupName);
        dto.setOrderCount((long) orders.size());
        dto.setOverdueCount(orders.stream().filter(o -> o.getStatus() == MaintenanceStatus.OVERDUE).count());
        dto.setComplaintCount(orders.stream().filter(o -> Boolean.TRUE.equals(o.getComplaint())).count());
        dto.setAvgOutageHours(orders.stream().mapToLong(this::calculateOutageHours).average().orElse(0));
        dto.setTotalCost(orders.stream()
                .flatMap(o -> maintenanceRecordRepository.findByMaintenanceOrderIdOrderByCreatedAtDesc(o.getId()).stream())
                .mapToDouble(r -> Optional.ofNullable(r.getLaborCost()).orElse(0D) + Optional.ofNullable(r.getPartsCost()).orElse(0D))
                .sum());
        return dto;
    }

    public Map<String, Long> getDashboardStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        List<MaintenanceOrder> allOrders = maintenanceOrderRepository.findAll();
        stats.put("totalOrders", (long) allOrders.size());
        stats.put("pendingOrders", allOrders.stream().filter(o -> o.getStatus() == MaintenanceStatus.SUBMITTED).count());
        stats.put("inProgressOrders", allOrders.stream().filter(o -> o.getStatus() == MaintenanceStatus.IN_PROGRESS).count());
        stats.put("overdueOrders", allOrders.stream().filter(o -> o.getStatus() == MaintenanceStatus.OVERDUE).count());
        stats.put("restoredOrders", allOrders.stream().filter(o -> o.getStatus() == MaintenanceStatus.RESTORED).count());
        stats.put("complaintOrders", allOrders.stream().filter(o -> Boolean.TRUE.equals(o.getComplaint())).count());
        return stats;
    }
}
