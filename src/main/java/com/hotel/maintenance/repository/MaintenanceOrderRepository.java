package com.hotel.maintenance.repository;

import com.hotel.maintenance.entity.MaintenanceOrder;
import com.hotel.maintenance.enums.FaultType;
import com.hotel.maintenance.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceOrderRepository extends JpaRepository<MaintenanceOrder, Long> {
    MaintenanceOrder findByOrderNo(String orderNo);
    List<MaintenanceOrder> findByStatus(MaintenanceStatus status);
    List<MaintenanceOrder> findByRoomId(Long roomId);

    @Query("SELECT m FROM MaintenanceOrder m WHERE m.engineer.id = :engineerId")
    List<MaintenanceOrder> findByEngineerId(@Param("engineerId") Long engineerId);

    @Query("SELECT m FROM MaintenanceOrder m WHERE m.status IN :statuses")
    List<MaintenanceOrder> findByStatusIn(@Param("statuses") List<MaintenanceStatus> statuses);

    @Query("SELECT m FROM MaintenanceOrder m WHERE m.createdAt BETWEEN :start AND :end")
    List<MaintenanceOrder> findByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT m FROM MaintenanceOrder m WHERE m.estimatedRepairTime < :now AND m.status = 'IN_PROGRESS'")
    List<MaintenanceOrder> findOverdueOrders(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(m) FROM MaintenanceOrder m WHERE m.faultType = :faultType")
    Long countByFaultType(@Param("faultType") FaultType faultType);
}
