package com.example.instrument.repository;

import com.example.instrument.entity.ReceiveRecord;
import com.example.instrument.entity.ReceiveRecord.ReceiveResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReceiveRecordRepository extends JpaRepository<ReceiveRecord, Long> {
    
    Optional<ReceiveRecord> findByReceiveNo(String receiveNo);
    
    List<ReceiveRecord> findByInstrumentPackageId(Long packageId);
    
    @Query("SELECT r FROM ReceiveRecord r WHERE r.instrumentPackage.id = :packageId ORDER BY r.createTime DESC")
    Optional<ReceiveRecord> findLatestByPackageId(Long packageId);
    
    List<ReceiveRecord> findByDepartment(String department);
    
    List<ReceiveRecord> findByResult(ReceiveResult result);
}