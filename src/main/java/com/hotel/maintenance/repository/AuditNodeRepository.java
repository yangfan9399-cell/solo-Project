package com.hotel.maintenance.repository;

import com.hotel.maintenance.entity.AuditNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditNodeRepository extends JpaRepository<AuditNode, Long> {
    List<AuditNode> findByMaintenanceOrderIdOrderByCreatedAt(Long maintenanceOrderId);
}
