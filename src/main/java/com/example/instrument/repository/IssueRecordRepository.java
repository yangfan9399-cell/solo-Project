package com.example.instrument.repository;

import com.example.instrument.entity.IssueRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IssueRecordRepository extends JpaRepository<IssueRecord, Long> {
    
    Optional<IssueRecord> findByIssueNo(String issueNo);
    
    List<IssueRecord> findByInstrumentPackageId(Long packageId);
    
    @Query("SELECT r FROM IssueRecord r WHERE r.instrumentPackage.id = :packageId ORDER BY r.createTime DESC")
    Optional<IssueRecord> findLatestByPackageId(Long packageId);
    
    List<IssueRecord> findByDepartment(String department);
    
    List<IssueRecord> findByOperator(String operator);
}