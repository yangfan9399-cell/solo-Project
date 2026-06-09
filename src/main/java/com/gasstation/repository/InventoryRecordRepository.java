package com.gasstation.repository;

import com.gasstation.entity.InventoryRecord;
import com.gasstation.entity.InventoryStatus;
import com.gasstation.entity.DiscrepancyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InventoryRecordRepository extends JpaRepository<InventoryRecord, Long> {

    List<InventoryRecord> findByStationIdOrderByInventoryDateDesc(Long stationId);

    List<InventoryRecord> findByTankIdOrderByInventoryDateDesc(Long tankId);

    List<InventoryRecord> findByStatusOrderByInventoryDateDesc(InventoryStatus status);

    List<InventoryRecord> findByInventoryDateBetweenOrderByInventoryDateDesc(LocalDate startDate, LocalDate endDate);

    @Query("SELECT r FROM InventoryRecord r WHERE " +
           "(:stationId IS NULL OR r.station.id = :stationId) AND " +
           "(:productId IS NULL OR r.oilProduct.id = :productId) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:discrepancyType IS NULL OR r.discrepancyType = :discrepancyType) AND " +
           "(:startDate IS NULL OR r.inventoryDate >= :startDate) AND " +
           "(:endDate IS NULL OR r.inventoryDate <= :endDate) " +
           "ORDER BY r.inventoryDate DESC")
    List<InventoryRecord> findByConditions(
            @Param("stationId") Long stationId,
            @Param("productId") Long productId,
            @Param("status") InventoryStatus status,
            @Param("discrepancyType") DiscrepancyType discrepancyType,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    InventoryRecord findByRecordNo(String recordNo);

    @Query("SELECT r.discrepancyType, COUNT(r), SUM(r.differenceVolume) " +
           "FROM InventoryRecord r GROUP BY r.discrepancyType")
    List<Object[]> countByDiscrepancyType();

    @Query("SELECT r.station.stationName, COUNT(r), SUM(r.differenceVolume) " +
           "FROM InventoryRecord r GROUP BY r.station.id, r.station.stationName")
    List<Object[]> sumByStation();

    @Query("SELECT r.oilProduct.productName, COUNT(r), SUM(r.differenceVolume), AVG(r.lossRate) " +
           "FROM InventoryRecord r GROUP BY r.oilProduct.id, r.oilProduct.productName")
    List<Object[]> sumByProduct();
}
