package com.example.coldchain.repository;

import com.example.coldchain.entity.TemperatureRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TemperatureRecordRepository extends JpaRepository<TemperatureRecord, Long> {

    List<TemperatureRecord> findByWaybillIdOrderByRecordTimeAsc(Long waybillId);

    List<TemperatureRecord> findByWaybillIdAndIsExceptionTrue(Long waybillId);

    @Query("SELECT tr FROM TemperatureRecord tr WHERE tr.waybillId = :waybillId AND tr.recordTime BETWEEN :startTime AND :endTime")
    List<TemperatureRecord> findByWaybillIdAndTimeRange(@Param("waybillId") Long waybillId, 
                                                        @Param("startTime") LocalDateTime startTime, 
                                                        @Param("endTime") LocalDateTime endTime);

    @Query("SELECT tr FROM TemperatureRecord tr WHERE tr.waybillId = :waybillId ORDER BY tr.recordTime DESC LIMIT 1")
    TemperatureRecord findLatestByWaybillId(@Param("waybillId") Long waybillId);
}