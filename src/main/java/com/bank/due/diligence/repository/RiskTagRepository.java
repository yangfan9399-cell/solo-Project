package com.bank.due.diligence.repository;

import com.bank.due.diligence.entity.RiskTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskTagRepository extends JpaRepository<RiskTag, Long> {

    List<RiskTag> findByApplicationId(Long applicationId);

    List<RiskTag> findByApplicationIdOrderByRiskLevelDesc(Long applicationId);
}
