package com.manufacturing.fixture.repository;

import com.manufacturing.fixture.entity.CalibrationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalibrationRecordRepository extends JpaRepository<CalibrationRecord, Long> {

    List<CalibrationRecord> findByFixtureIdOrderByCalibrationDateDesc(Long fixtureId);

    @Query("SELECT c FROM CalibrationRecord c WHERE c.calibrationDate BETWEEN :startDate AND :endDate ORDER BY c.calibrationDate DESC")
    List<CalibrationRecord> findByCalibrationDateBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT c.result, COUNT(c) FROM CalibrationRecord c WHERE c.calibrationDate BETWEEN :startDate AND :endDate GROUP BY c.result")
    List<Object[]> countByResultAndDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
