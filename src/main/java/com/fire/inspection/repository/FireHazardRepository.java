package com.fire.inspection.repository;

import com.fire.inspection.entity.FireHazard;
import com.fire.inspection.enums.HazardCategory;
import com.fire.inspection.enums.HazardLevel;
import com.fire.inspection.enums.HazardStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FireHazardRepository extends JpaRepository<FireHazard, Long>, JpaSpecificationExecutor<FireHazard> {

    List<FireHazard> findByStatus(HazardStatus status);

    List<FireHazard> findByResponsibleDepartment(String department);

    List<FireHazard> findByBuilding(String building);

    List<FireHazard> findByCategory(HazardCategory category);

    List<FireHazard> findByLevel(HazardLevel level);

    @Query("SELECT h FROM FireHazard h WHERE h.deadline < :now AND h.status NOT IN ('ACCEPTED', 'OVERDUE')")
    List<FireHazard> findOverdueHazards(LocalDateTime now);

    @Query("SELECT h.building, COUNT(h) FROM FireHazard h GROUP BY h.building")
    List<Object[]> countByBuilding();

    @Query("SELECT h.category, COUNT(h) FROM FireHazard h GROUP BY h.category")
    List<Object[]> countByCategory();

    @Query("SELECT h.responsibleDepartment, COUNT(h) FROM FireHazard h GROUP BY h.responsibleDepartment")
    List<Object[]> countByDepartment();

    @Query("SELECT h.status, COUNT(h) FROM FireHazard h GROUP BY h.status")
    List<Object[]> countByStatus();

    @Query("SELECT h.level, COUNT(h) FROM FireHazard h GROUP BY h.level")
    List<Object[]> countByLevel();

    @Query("SELECT h FROM FireHazard h WHERE h.status = 'ACCEPTED' AND h.rectifiedAt IS NOT NULL AND h.createdAt IS NOT NULL")
    List<FireHazard> findCompletedHazards();
}
