package com.campus.dormrepair.repository;

import com.campus.dormrepair.entity.RepairHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepairHistoryRepository extends JpaRepository<RepairHistory, Long> {

    List<RepairHistory> findByRepairIdOrderByOperateTimeAsc(Long repairId);
}
