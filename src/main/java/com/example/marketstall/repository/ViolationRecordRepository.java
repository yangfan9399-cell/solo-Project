package com.example.marketstall.repository;

import com.example.marketstall.entity.ViolationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ViolationRecordRepository extends JpaRepository<ViolationRecord, Long> {
    List<ViolationRecord> findByStallId(Long stallId);
    List<ViolationRecord> findByStatus(String status);
    List<ViolationRecord> findByViolationType(String violationType);
    
    @Query("SELECT v.violationType, COUNT(v) FROM ViolationRecord v GROUP BY v.violationType")
    List<Object[]> countByViolationType();
    
    @Query("SELECT v.stallId, SUM(v.pointsDeducted) FROM ViolationRecord v GROUP BY v.stallId")
    List<Object[]> sumPointsByStallId();
}