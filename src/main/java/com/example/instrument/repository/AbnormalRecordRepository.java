package com.example.instrument.repository;

import com.example.instrument.entity.AbnormalRecord;
import com.example.instrument.entity.AbnormalRecord.AbnormalType;
import com.example.instrument.entity.AbnormalRecord.ResolveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AbnormalRecordRepository extends JpaRepository<AbnormalRecord, Long> {
    
    List<AbnormalRecord> findByInstrumentPackageId(Long packageId);
    
    List<AbnormalRecord> findByAbnormalType(AbnormalType abnormalType);
    
    List<AbnormalRecord> findByResolveStatus(ResolveStatus resolveStatus);
    
    List<AbnormalRecord> findByAbnormalTypeAndResolveStatus(AbnormalType abnormalType, ResolveStatus resolveStatus);
}