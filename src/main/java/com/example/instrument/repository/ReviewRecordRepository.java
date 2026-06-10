package com.example.instrument.repository;

import com.example.instrument.entity.ReviewRecord;
import com.example.instrument.entity.ReviewRecord.ReviewResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRecordRepository extends JpaRepository<ReviewRecord, Long> {
    
    Optional<ReviewRecord> findByReviewNo(String reviewNo);
    
    List<ReviewRecord> findByInstrumentPackageId(Long packageId);
    
    @Query("SELECT r FROM ReviewRecord r WHERE r.instrumentPackage.id = :packageId ORDER BY r.createTime DESC")
    Optional<ReviewRecord> findLatestByPackageId(Long packageId);
    
    List<ReviewRecord> findByResult(ReviewResult result);
    
    List<ReviewRecord> findByOperator(String operator);
}