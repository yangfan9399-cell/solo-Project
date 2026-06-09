package com.fire.inspection.repository;

import com.fire.inspection.entity.Rectification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RectificationRepository extends JpaRepository<Rectification, Long> {

    List<Rectification> findByHazardIdOrderByCreatedAtDesc(Long hazardId);

    List<Rectification> findByHazardIdOrderByCreatedAtAsc(Long hazardId);
}
