package com.bank.due.diligence.repository;

import com.bank.due.diligence.entity.Material;
import com.bank.due.diligence.enums.MaterialStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByApplicationId(Long applicationId);

    List<Material> findByApplicationIdAndStatus(Long applicationId, MaterialStatus status);

    long countByApplicationIdAndStatus(Long applicationId, MaterialStatus status);
}
