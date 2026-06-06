package com.manufacturing.fixture.repository;

import com.manufacturing.fixture.entity.BorrowRecord;
import com.manufacturing.fixture.entity.BorrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {

    List<BorrowRecord> findByFixtureIdOrderByCreatedAtDesc(Long fixtureId);

    List<BorrowRecord> findByProductionLineOrderByCreatedAtDesc(String productionLine);

    List<BorrowRecord> findByStatus(BorrowStatus status);

    List<BorrowRecord> findByApplicantOrderByCreatedAtDesc(String applicant);

    @Query("SELECT b FROM BorrowRecord b WHERE b.status = 'BORROWED' AND b.expectedReturnDate < :date")
    List<BorrowRecord> findOverdueBorrows(LocalDate date);

    @Query("SELECT b.productionLine, COUNT(b) FROM BorrowRecord b WHERE b.borrowDate BETWEEN :startDate AND :endDate GROUP BY b.productionLine")
    List<Object[]> countByProductionLine(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT b FROM BorrowRecord b WHERE b.borrowDate BETWEEN :startDate AND :endDate ORDER BY b.borrowDate DESC")
    List<BorrowRecord> findByBorrowDateBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(b) FROM BorrowRecord b WHERE b.status IN :statuses AND b.borrowDate BETWEEN :startDate AND :endDate")
    Long countByStatusInAndBorrowDateBetween(@Param("statuses") List<BorrowStatus> statuses, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT b.status, COUNT(b) FROM BorrowRecord b WHERE b.borrowDate BETWEEN :startDate AND :endDate GROUP BY b.status")
    List<Object[]> countByStatusAndDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    List<BorrowRecord> findByFixtureIdAndStatus(Long fixtureId, BorrowStatus status);
}
