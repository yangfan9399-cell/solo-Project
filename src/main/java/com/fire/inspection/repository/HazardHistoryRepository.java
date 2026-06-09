package com.fire.inspection.repository;

import com.fire.inspection.entity.HazardHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HazardHistoryRepository extends JpaRepository<HazardHistory, Long> {

    List<HazardHistory> findByHazardIdOrderByCreatedAtAsc(Long hazardId);

    List<HazardHistory> findByHazardIdOrderByCreatedAtDesc(Long hazardId);
}
