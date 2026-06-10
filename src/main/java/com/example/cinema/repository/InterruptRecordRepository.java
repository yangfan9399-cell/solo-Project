
package com.example.cinema.repository;

import com.example.cinema.entity.FaultType;
import com.example.cinema.entity.InterruptRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterruptRecordRepository extends JpaRepository<InterruptRecord, Long> {
    List<InterruptRecord> findByScreeningId(Long screeningId);
    List<InterruptRecord> findByIsResolvedFalse();
    List<InterruptRecord> findByFaultType(FaultType faultType);
    List<InterruptRecord> findByScreeningHallCinemaId(Long cinemaId);
    
    @Query("SELECT i FROM InterruptRecord i JOIN FETCH i.screening s JOIN FETCH s.hall h JOIN FETCH s.movie m WHERE i.isResolved = :isResolved ORDER BY i.interruptTime DESC")
    List<InterruptRecord> findWithScreeningByResolvedStatus(@Param("isResolved") Boolean isResolved);
    
    @Query("SELECT i FROM InterruptRecord i JOIN FETCH i.screening s JOIN FETCH s.hall h JOIN FETCH s.movie m ORDER BY i.interruptTime DESC")
    List<InterruptRecord> findAllWithScreening();
}
