package com.campus.dormrepair.service;

import com.campus.dormrepair.dto.BuildingStats;
import com.campus.dormrepair.dto.FaultTypeStats;
import com.campus.dormrepair.dto.RepairDurationStats;
import com.campus.dormrepair.dto.TimeoutStats;
import com.campus.dormrepair.entity.Repair;
import com.campus.dormrepair.enums.FaultType;
import com.campus.dormrepair.enums.TimeoutReason;
import com.campus.dormrepair.repository.RepairRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class StatsService {

    @Autowired
    private RepairRepository repairRepository;

    public List<BuildingStats> getBuildingStats() {
        List<Object[]> results = repairRepository.countByBuilding();
        List<BuildingStats> stats = new ArrayList<>();
        for (Object[] row : results) {
            BuildingStats s = new BuildingStats();
            s.setBuilding((String) row[0]);
            s.setTotalCount(((Number) row[1]).longValue());
            s.setCompletedCount(((Number) row[2]).longValue());
            s.setTimeoutCount(((Number) row[3]).longValue());
            stats.add(s);
        }
        return stats;
    }

    public List<FaultTypeStats> getFaultTypeStats() {
        List<Object[]> results = repairRepository.countByFaultTypeWithDuration();
        List<FaultTypeStats> stats = new ArrayList<>();
        for (Object[] row : results) {
            FaultTypeStats s = new FaultTypeStats();
            FaultType type = (FaultType) row[0];
            s.setFaultType(type.name());
            s.setFaultTypeLabel(type.getLabel());
            s.setCount(((Number) row[1]).longValue());
            s.setAvgRepairMinutes(row[2] != null ? ((Number) row[2]).doubleValue() : 0.0);
            stats.add(s);
        }
        return stats;
    }

    public List<TimeoutStats> getTimeoutStats() {
        List<Object[]> results = repairRepository.countByTimeoutReason();
        List<TimeoutStats> stats = new ArrayList<>();
        for (Object[] row : results) {
            TimeoutStats s = new TimeoutStats();
            TimeoutReason reason = (TimeoutReason) row[0];
            s.setTimeoutReason(reason.name());
            s.setTimeoutReasonLabel(reason.getLabel());
            s.setCount(((Number) row[1]).longValue());
            stats.add(s);
        }
        return stats;
    }

    public List<RepairDurationStats> getRepairDurationStats() {
        List<Repair> repairs = repairRepository.findCompletedWithDuration();

        long under30 = 0;
        long between30and60 = 0;
        long between60and120 = 0;
        long over120 = 0;

        for (Repair r : repairs) {
            if (r.getRepairDurationMinutes() == null) continue;
            long minutes = r.getRepairDurationMinutes();
            if (minutes < 30) {
                under30++;
            } else if (minutes < 60) {
                between30and60++;
            } else if (minutes < 120) {
                between60and120++;
            } else {
                over120++;
            }
        }

        List<RepairDurationStats> stats = new ArrayList<>();
        stats.add(new RepairDurationStats("30分钟以内", under30));
        stats.add(new RepairDurationStats("30-60分钟", between30and60));
        stats.add(new RepairDurationStats("1-2小时", between60and120));
        stats.add(new RepairDurationStats("2小时以上", over120));
        return stats;
    }
}
