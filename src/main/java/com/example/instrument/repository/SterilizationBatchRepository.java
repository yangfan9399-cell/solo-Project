package com.example.instrument.repository;

import com.example.instrument.entity.SterilizationBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SterilizationBatchRepository extends JpaRepository<SterilizationBatch, Long> {
    
    Optional<SterilizationBatch> findByBatchNo(String batchNo);
    
    List<SterilizationBatch> findByInstrumentPackageId(Long packageId);
    
    @Query("SELECT b FROM SterilizationBatch b WHERE b.instrumentPackage.id = :packageId ORDER BY b.sterilizationDate DESC")
    Optional<SterilizationBatch> findLatestByPackageId(Long packageId);
    
    @Query("SELECT b FROM SterilizationBatch b WHERE b.expiryDate < :date")
    List<SterilizationBatch> findExpiredBatches(LocalDate date);
    
    List<SterilizationBatch> findByOperator(String operator);
}