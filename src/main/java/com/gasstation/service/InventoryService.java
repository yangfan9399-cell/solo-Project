package com.gasstation.service;

import com.gasstation.entity.*;
import com.gasstation.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryRecordRepository inventoryRecordRepository;

    @Autowired
    private InventoryHistoryRepository historyRepository;

    @Autowired
    private TankRepository tankRepository;

    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private OilProductRepository oilProductRepository;

    @Autowired
    private DeliveryOrderRepository deliveryOrderRepository;

    public List<InventoryRecord> findAll() {
        return inventoryRecordRepository.findAll();
    }

    public List<InventoryRecord> findByConditions(Long stationId, Long productId,
                                                   InventoryStatus status,
                                                   DiscrepancyType discrepancyType,
                                                   LocalDate startDate, LocalDate endDate) {
        return inventoryRecordRepository.findByConditions(stationId, productId, status,
                discrepancyType, startDate, endDate);
    }

    public InventoryRecord findById(Long id) {
        return inventoryRecordRepository.findById(id).orElse(null);
    }

    public InventoryRecord findByRecordNo(String recordNo) {
        return inventoryRecordRepository.findByRecordNo(recordNo);
    }

    public List<InventoryHistory> getHistory(Long recordId) {
        return historyRepository.findByInventoryRecordIdOrderByActionTimeAsc(recordId);
    }

    @Transactional
    public InventoryRecord createInventory(InventoryRecord record, String operator) {
        Tank tank = tankRepository.findById(record.getTank().getId()).orElse(null);
        if (tank != null) {
            record.setStation(tank.getStation());
            record.setOilProduct(tank.getOilProduct());
            record.setGaugeNormal(tank.getGaugeStatus());
        }

        calculateDifference(record);

        determineDiscrepancyType(record);

        record.setStatus(InventoryStatus.PENDING_REVIEW);

        String recordNo = "PD" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + String.format("%04d", System.currentTimeMillis() % 10000);
        record.setRecordNo(recordNo);

        record.setStationManager(operator);

        InventoryRecord saved = inventoryRecordRepository.save(record);

        addHistory(saved, InventoryStatus.PENDING_REVIEW, operator, UserRole.STATION_MANAGER,
                "站长登记盘点，提交待复核");

        return saved;
    }

    private void calculateDifference(InventoryRecord record) {
        if (record.getOpeningVolume() != null && record.getDeliveryVolume() != null
                && record.getSalesVolume() != null) {
            BigDecimal theoretical = record.getOpeningVolume()
                    .add(record.getDeliveryVolume())
                    .subtract(record.getSalesVolume());
            record.setTheoreticalVolume(theoretical);
        }

        if (record.getGaugeVolume() != null && record.getTheoreticalVolume() != null) {
            BigDecimal diff = record.getGaugeVolume().subtract(record.getTheoreticalVolume());
            record.setDifferenceVolume(diff);
        }

        if (record.getDifferenceVolume() != null && record.getTheoreticalVolume() != null
                && record.getTheoreticalVolume().compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal rate = record.getDifferenceVolume().abs()
                    .divide(record.getTheoreticalVolume(), 4, RoundingMode.HALF_UP);
            record.setLossRate(rate);
        }
    }

    private void determineDiscrepancyType(InventoryRecord record) {
        if (record.getGaugeNormal() == null || !record.getGaugeNormal()) {
            record.setDiscrepancyType(DiscrepancyType.GAUGE_ERROR);
            return;
        }

        if (record.getLossRate() == null) {
            record.setDiscrepancyType(DiscrepancyType.NORMAL);
            return;
        }

        BigDecimal threshold = new BigDecimal("0.003");
        if (record.getLossRate().compareTo(threshold) > 0) {
            if (record.getDeliveryVolume() != null && record.getDifferenceVolume().compareTo(BigDecimal.ZERO) < 0) {
                if (record.getDifferenceVolume().abs().compareTo(
                        record.getDeliveryVolume().multiply(new BigDecimal("0.02"))) > 0) {
                    record.setDiscrepancyType(DiscrepancyType.DELIVERY_MISMATCH);
                    return;
                }
            }
            record.setDiscrepancyType(DiscrepancyType.EXCESS_LOSS);
        } else {
            record.setDiscrepancyType(DiscrepancyType.NORMAL);
        }
    }

    @Transactional
    public InventoryRecord reviewInventory(Long id, boolean pass, String gaugerRemark, String operator) {
        InventoryRecord record = inventoryRecordRepository.findById(id).orElse(null);
        if (record == null) {
            return null;
        }

        record.setGauger(operator);
        record.setGaugerRemark(gaugerRemark);

        if (pass) {
            record.setStatus(InventoryStatus.PENDING_DISPOSAL);
            addHistory(record, InventoryStatus.PENDING_DISPOSAL, operator, UserRole.GAUGER,
                    "计量员复核通过，提交待处置");
        } else {
            record.setStatus(InventoryStatus.REJECTED);
            addHistory(record, InventoryStatus.REJECTED, operator, UserRole.GAUGER,
                    "计量员驳回，原因：" + gaugerRemark);
        }

        return inventoryRecordRepository.save(record);
    }

    @Transactional
    public InventoryRecord adjustInventory(Long id, BigDecimal adjustedVolume, String remark, String operator) {
        InventoryRecord record = inventoryRecordRepository.findById(id).orElse(null);
        if (record == null) {
            return null;
        }

        if (record.getDiscrepancyType() == DiscrepancyType.GAUGE_ERROR) {
            throw new RuntimeException("液位仪异常时禁止直接调整库存");
        }

        record.setAdjustedVolume(adjustedVolume);
        record.setSupervisor(operator);
        record.setSupervisorRemark(remark);
        record.setStatus(InventoryStatus.ADJUSTED);

        addHistory(record, InventoryStatus.ADJUSTED, operator, UserRole.REGIONAL_SUPERVISOR,
                "区域主管调整库存，调整量：" + adjustedVolume + "L，备注：" + remark);

        return inventoryRecordRepository.save(record);
    }

    @Transactional
    public InventoryRecord investigateInventory(Long id, String remark, String operator) {
        InventoryRecord record = inventoryRecordRepository.findById(id).orElse(null);
        if (record == null) {
            return null;
        }

        record.setSupervisor(operator);
        record.setSupervisorRemark(remark);
        record.setStatus(InventoryStatus.INVESTIGATING);

        addHistory(record, InventoryStatus.INVESTIGATING, operator, UserRole.REGIONAL_SUPERVISOR,
                "区域主管决定追查，备注：" + remark);

        return inventoryRecordRepository.save(record);
    }

    @Transactional
    public InventoryRecord archiveInventory(Long id, String remark, String operator) {
        InventoryRecord record = inventoryRecordRepository.findById(id).orElse(null);
        if (record == null) {
            return null;
        }

        record.setSupervisor(operator);
        record.setSupervisorRemark(remark);
        record.setStatus(InventoryStatus.ARCHIVED);

        addHistory(record, InventoryStatus.ARCHIVED, operator, UserRole.REGIONAL_SUPERVISOR,
                "区域主管归档，备注：" + remark);

        return inventoryRecordRepository.save(record);
    }

    private void addHistory(InventoryRecord record, InventoryStatus actionType,
                            String operator, UserRole role, String remark) {
        InventoryHistory history = new InventoryHistory();
        history.setInventoryRecord(record);
        history.setActionType(actionType);
        history.setOperator(operator);
        history.setOperatorRole(role);
        history.setRemark(remark);
        historyRepository.save(history);
    }

    public List<Object[]> getSummaryByDiscrepancyType() {
        return inventoryRecordRepository.countByDiscrepancyType();
    }

    public List<Object[]> getSummaryByStation() {
        return inventoryRecordRepository.sumByStation();
    }

    public List<Object[]> getSummaryByProduct() {
        return inventoryRecordRepository.sumByProduct();
    }
}
