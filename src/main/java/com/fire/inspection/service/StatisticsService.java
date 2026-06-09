package com.fire.inspection.service;

import com.fire.inspection.entity.FireHazard;
import com.fire.inspection.enums.HazardCategory;
import com.fire.inspection.enums.HazardLevel;
import com.fire.inspection.enums.HazardStatus;
import com.fire.inspection.repository.FireHazardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final FireHazardRepository fireHazardRepository;

    public Map<String, Long> getStatusStatistics() {
        List<Object[]> results = fireHazardRepository.countByStatus();
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : results) {
            HazardStatus status = (HazardStatus) row[0];
            Long count = (Long) row[1];
            map.put(status.getDisplayName(), count);
        }
        return map;
    }

    public Map<String, Long> getBuildingStatistics() {
        List<Object[]> results = fireHazardRepository.countByBuilding();
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : results) {
            String building = (String) row[0];
            Long count = (Long) row[1];
            map.put(building != null ? building : "未指定", count);
        }
        return map.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    public Map<String, Long> getCategoryStatistics() {
        List<Object[]> results = fireHazardRepository.countByCategory();
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : results) {
            HazardCategory category = (HazardCategory) row[0];
            Long count = (Long) row[1];
            String name = category != null ? category.getDisplayName() : "未分类";
            map.put(name, count);
        }
        return map.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    public Map<String, Long> getDepartmentStatistics() {
        List<Object[]> results = fireHazardRepository.countByDepartment();
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : results) {
            String dept = (String) row[0];
            Long count = (Long) row[1];
            map.put(dept != null ? dept : "未分配", count);
        }
        return map.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    public Map<String, Long> getLevelStatistics() {
        List<Object[]> results = fireHazardRepository.countByLevel();
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] row : results) {
            HazardLevel level = (HazardLevel) row[0];
            Long count = (Long) row[1];
            String name = level != null ? level.getDisplayName() : "未评定";
            map.put(name, count);
        }
        return map;
    }

    public Map<String, Object> getRectificationTimeStatistics() {
        List<FireHazard> completed = fireHazardRepository.findCompletedHazards();

        if (completed.isEmpty()) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("totalCount", 0);
            result.put("avgDays", 0);
            result.put("maxDays", 0);
            result.put("minDays", 0);
            result.put("distribution", new LinkedHashMap<String, Long>());
            return result;
        }

        List<Long> daysList = completed.stream()
                .map(h -> {
                    if (h.getCreatedAt() != null && h.getAcceptedAt() != null) {
                        return Duration.between(h.getCreatedAt(), h.getAcceptedAt()).toDays();
                    }
                    return 0L;
                })
                .filter(d -> d > 0)
                .collect(Collectors.toList());

        long totalCount = daysList.size();
        long avgDays = totalCount > 0 ? daysList.stream().mapToLong(Long::longValue).sum() / totalCount : 0;
        long maxDays = daysList.stream().mapToLong(Long::longValue).max().orElse(0);
        long minDays = daysList.stream().mapToLong(Long::longValue).min().orElse(0);

        Map<String, Long> distribution = new LinkedHashMap<>();
        distribution.put("1天内", daysList.stream().filter(d -> d <= 1).count());
        distribution.put("1-3天", daysList.stream().filter(d -> d > 1 && d <= 3).count());
        distribution.put("3-7天", daysList.stream().filter(d -> d > 3 && d <= 7).count());
        distribution.put("7-15天", daysList.stream().filter(d -> d > 7 && d <= 15).count());
        distribution.put("15天以上", daysList.stream().filter(d -> d > 15).count());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalCount", totalCount);
        result.put("avgDays", avgDays);
        result.put("maxDays", maxDays);
        result.put("minDays", minDays);
        result.put("distribution", distribution);

        return result;
    }

    public long getTotalCount() {
        return fireHazardRepository.count();
    }

    public long getAcceptedCount() {
        return fireHazardRepository.findByStatus(HazardStatus.ACCEPTED).size();
    }

    public long getOverdueCount() {
        return fireHazardRepository.findByStatus(HazardStatus.OVERDUE).size();
    }
}
