package com.campus.dormrepair.repository;

import com.campus.dormrepair.entity.Repair;
import com.campus.dormrepair.enums.RepairStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepairRepository extends JpaRepository<Repair, Long> {

    Optional<Repair> findByOrderNo(String orderNo);

    List<Repair> findByStudentIdOrderBySubmitTimeDesc(Long studentId);

    List<Repair> findByStatusOrderBySubmitTimeDesc(RepairStatus status);

    List<Repair> findByRepairmanIdOrderBySubmitTimeDesc(Long repairmanId);

    List<Repair> findAllByOrderBySubmitTimeDesc();

    @Query("SELECT r.building, COUNT(r), " +
           "SUM(CASE WHEN r.status = 'CLOSED' OR r.status = 'REVIEWED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN r.status = 'TIMEOUT' THEN 1 ELSE 0 END) " +
           "FROM Repair r GROUP BY r.building ORDER BY r.building")
    List<Object[]> countByBuilding();

    @Query("SELECT r.faultType, COUNT(r), AVG(r.repairDurationMinutes) " +
           "FROM Repair r WHERE r.repairDurationMinutes IS NOT NULL " +
           "GROUP BY r.faultType")
    List<Object[]> countByFaultTypeWithDuration();

    @Query("SELECT r.timeoutReason, COUNT(r) FROM Repair r " +
           "WHERE r.timeoutReason IS NOT NULL GROUP BY r.timeoutReason")
    List<Object[]> countByTimeoutReason();

    @Query("SELECT r FROM Repair r WHERE r.repairDurationMinutes IS NOT NULL")
    List<Repair> findCompletedWithDuration();
}
