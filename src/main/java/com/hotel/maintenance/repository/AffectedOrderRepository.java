package com.hotel.maintenance.repository;

import com.hotel.maintenance.entity.AffectedOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AffectedOrderRepository extends JpaRepository<AffectedOrder, Long> {
    List<AffectedOrder> findByMaintenanceOrderId(Long maintenanceOrderId);
}
