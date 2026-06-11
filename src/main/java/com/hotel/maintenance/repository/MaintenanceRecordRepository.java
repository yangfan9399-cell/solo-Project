package com.hotel.maintenance.repository;

import com.hotel.maintenance.entity.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByMaintenanceOrderIdOrderByCreatedAtDesc(Long maintenanceOrderId);
    List<MaintenanceRecord> findByEngineerId(Long engineerId);
}
