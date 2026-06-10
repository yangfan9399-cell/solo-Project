package com.example.contract.repository;

import com.example.contract.entity.SigningRecord;
import com.example.contract.enums.FailureReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SigningRecordRepository extends JpaRepository<SigningRecord, Long> {
    List<SigningRecord> findByContractId(Long contractId);
    List<SigningRecord> findByContractIdOrderByCreatedAtDesc(Long contractId);
    List<SigningRecord> findByFailureReason(FailureReason failureReason);
    
    @Query("SELECT COUNT(r) FROM SigningRecord r WHERE r.contractId = :contractId")
    Integer countByContractId(@Param("contractId") Long contractId);
    
    @Query("SELECT r FROM SigningRecord r WHERE r.authSuccess = false ORDER BY r.createdAt DESC")
    List<SigningRecord> findFailedRecords();
}