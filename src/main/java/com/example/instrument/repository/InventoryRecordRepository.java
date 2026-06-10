package com.example.instrument.repository;

import com.example.instrument.entity.InventoryRecord;
import com.example.instrument.entity.InventoryRecord.InventoryResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRecordRepository extends JpaRepository<InventoryRecord, Long> {
    
    Optional<InventoryRecord> findByInventoryNo(String inventoryNo);
    
    List<InventoryRecord> findByInstrumentPackageId(Long packageId);
    
    @Query("SELECT r FROM InventoryRecord r WHERE r.instrumentPackage.id = :packageId ORDER BY r.createTime DESC")
    Optional<InventoryRecord> findLatestByPackageId(Long packageId);
    
    List<InventoryRecord> findByResult(InventoryResult result);
    
    List<InventoryRecord> findByOperator(String operator);
}