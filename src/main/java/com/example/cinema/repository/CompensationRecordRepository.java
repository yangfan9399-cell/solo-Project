
package com.example.cinema.repository;

import com.example.cinema.entity.CompensationRecord;
import com.example.cinema.entity.CompensationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CompensationRecordRepository extends JpaRepository<CompensationRecord, Long> {
    List<CompensationRecord> findByInterruptRecordId(Long interruptRecordId);
    List<CompensationRecord> findByStatus(CompensationStatus status);
    List<CompensationRecord> findByIsArchivedFalse();
    List<CompensationRecord> findByInterruptRecordScreeningHallCinemaId(Long cinemaId);
    
    @Query("SELECT c FROM CompensationRecord c JOIN FETCH c.interruptRecord i JOIN FETCH i.screening s JOIN FETCH s.hall h JOIN FETCH s.movie m WHERE c.status = :status ORDER BY c.submitTime DESC")
    List<CompensationRecord> findWithInterruptRecordByStatus(@Param("status") CompensationStatus status);
    
    @Query("SELECT c FROM CompensationRecord c JOIN FETCH c.interruptRecord i JOIN FETCH i.screening s JOIN FETCH s.hall h JOIN FETCH s.movie m WHERE c.isArchived = :isArchived ORDER BY c.submitTime DESC")
    List<CompensationRecord> findWithInterruptRecordByArchivedStatus(@Param("isArchived") Boolean isArchived);
    
    @Query("SELECT SUM(c.compensationAmount) FROM CompensationRecord c WHERE c.interruptRecord.screening.hall.cinema.id = :cinemaId")
    BigDecimal sumCompensationByCinema(@Param("cinemaId") Long cinemaId);
    
    @Query("SELECT SUM(c.compensationAmount) FROM CompensationRecord c WHERE c.interruptRecord.faultType = :faultType")
    BigDecimal sumCompensationByFaultType(@Param("faultType") String faultType);
}
