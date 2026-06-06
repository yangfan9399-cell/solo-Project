package com.manufacturing.fixture.repository;

import com.manufacturing.fixture.entity.DamageRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DamageRecordRepository extends JpaRepository<DamageRecord, Long> {

    List<DamageRecord> findByFixtureIdOrderByOccurrenceTimeDesc(Long fixtureId);

    List<DamageRecord> findByProductionLineOrderByOccurrenceTimeDesc(String productionLine);

    @Query("SELECT d FROM DamageRecord d WHERE d.occurrenceTime BETWEEN :startDate AND :endDate ORDER BY d.occurrenceTime DESC")
    List<DamageRecord> findByOccurrenceTimeBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT d.damageType, COUNT(d), COALESCE(SUM(d.downtimeHours), 0) FROM DamageRecord d WHERE d.occurrenceTime BETWEEN :startDate AND :endDate GROUP BY d.damageType")
    List<Object[]> countByDamageTypeAndDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT d.productionLine, COUNT(d), COALESCE(SUM(d.downtimeHours), 0) FROM DamageRecord d WHERE d.occurrenceTime BETWEEN :startDate AND :endDate GROUP BY d.productionLine")
    List<Object[]> countByProductionLineAndDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COALESCE(SUM(d.downtimeHours), 0) FROM DamageRecord d WHERE d.occurrenceTime BETWEEN :startDate AND :endDate")
    Long sumDowntimeHours(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}
