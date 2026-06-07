package com.insurance.claim.repository;

import com.insurance.claim.entity.MaterialType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaterialTypeRepository extends JpaRepository<MaterialType, Long> {
    List<MaterialType> findByInsuranceTypeOrInsuranceTypeIsNullOrderBySortOrder(String insuranceType);

    List<MaterialType> findByRequiredTrueOrderBySortOrder();
}
