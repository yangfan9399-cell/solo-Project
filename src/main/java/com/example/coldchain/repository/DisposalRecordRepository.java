package com.example.coldchain.repository;

import com.example.coldchain.entity.DisposalRecord;
import com.example.coldchain.enums.DisposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisposalRecordRepository extends JpaRepository<DisposalRecord, Long> {

    List<DisposalRecord> findByWaybillIdOrderByCreatedAtDesc(Long waybillId);

    List<DisposalRecord> findByExceptionId(Long exceptionId);

    List<DisposalRecord> findByStatus(DisposalStatus status);

    @Query("SELECT d FROM DisposalRecord d WHERE d.status = 'COMPLETED' AND d.disposalTime IS NOT NULL")
    List<DisposalRecord> findCompletedWithDuration();
}