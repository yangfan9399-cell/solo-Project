package com.hospital.film.service;

import com.hospital.film.entity.FilmReissue;
import com.hospital.film.enums.AbnormalType;
import com.hospital.film.enums.ApplicationStatus;
import com.hospital.film.repository.FilmReissueRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatisticsService {

    private final FilmReissueRepository filmReissueRepository;

    public StatisticsService(FilmReissueRepository filmReissueRepository) {
        this.filmReissueRepository = filmReissueRepository;
    }

    public Map<String, Object> getOverviewStats() {
        Map<String, Object> stats = new HashMap<>();

        long total = filmReissueRepository.count();
        stats.put("total", total);

        List<Object[]> statusCounts = filmReissueRepository.countByStatus();
        Map<String, Object> statusMap = new HashMap<>();
        for (Object[] row : statusCounts) {
            ApplicationStatus status = (ApplicationStatus) row[0];
            Long count = (Long) row[1];
            statusMap.put(status.name(), count);
            statusMap.put(status.name() + "_desc", status.getDescription());
        }
        stats.put("statusCounts", statusMap);

        List<Object[]> abnormalCounts = filmReissueRepository.countByAbnormalType();
        Map<String, Object> abnormalMap = new HashMap<>();
        for (Object[] row : abnormalCounts) {
            AbnormalType type = (AbnormalType) row[0];
            Long count = (Long) row[1];
            abnormalMap.put(type.name(), count);
            abnormalMap.put(type.name() + "_desc", type.getDescription());
        }
        stats.put("abnormalCounts", abnormalMap);

        List<Object[]> sourceCounts = filmReissueRepository.countBySource();
        Map<String, Object> sourceMap = new HashMap<>();
        for (Object[] row : sourceCounts) {
            com.hospital.film.enums.ApplicationSource source = (com.hospital.film.enums.ApplicationSource) row[0];
            Long count = (Long) row[1];
            sourceMap.put(source.name(), count);
            sourceMap.put(source.name() + "_desc", source.getDescription());
        }
        stats.put("sourceCounts", sourceMap);

        BigDecimal totalFee = filmReissueRepository.sumFeeAmount();
        stats.put("totalFee", totalFee != null ? totalFee : BigDecimal.ZERO);

        calculateEfficiencyMetrics(stats);
        calculateAbnormalMetrics(stats);

        return stats;
    }

    private void calculateEfficiencyMetrics(Map<String, Object> stats) {
        List<FilmReissue> allApplications = filmReissueRepository.findAll();
        long total = allApplications.size();
        long archivedCount = allApplications.stream()
                .filter(f -> f.getStatus() == ApplicationStatus.ARCHIVED)
                .count();

        if (total > 0) {
            stats.put("archivedRate", BigDecimal.valueOf(archivedCount * 100.0 / total)
                    .setScale(1, RoundingMode.HALF_UP) + "%");
        } else {
            stats.put("archivedRate", "0%");
        }

        long totalProcessingHours = 0;
        long processedCount = 0;
        for (FilmReissue app : allApplications) {
            if (app.getAcceptTime() != null) {
                java.time.LocalDateTime endTime = app.getArchiveTime() != null ? app.getArchiveTime() : java.time.LocalDateTime.now();
                Duration duration = Duration.between(app.getAcceptTime(), endTime);
                totalProcessingHours += duration.toHours();
                processedCount++;
            }
        }

        if (processedCount > 0) {
            double avgHours = totalProcessingHours * 1.0 / processedCount;
            if (avgHours < 24) {
                stats.put("avgProcessingTime", BigDecimal.valueOf(avgHours).setScale(1, RoundingMode.HALF_UP) + "小时");
            } else {
                stats.put("avgProcessingTime", BigDecimal.valueOf(avgHours / 24).setScale(1, RoundingMode.HALF_UP) + "天");
            }
        } else {
            stats.put("avgProcessingTime", "0小时");
        }

        long reprocessCount = allApplications.stream()
                .filter(f -> f.getHistories() != null && f.getHistories().stream()
                        .anyMatch(h -> h.getOperationType() == com.hospital.film.enums.OperationType.REPROCESS))
                .count();
        stats.put("reprocessCount", reprocessCount);
    }

    private void calculateAbnormalMetrics(Map<String, Object> stats) {
        List<FilmReissue> allApplications = filmReissueRepository.findAll();
        long total = allApplications.size();
        long abnormalCount = allApplications.stream()
                .filter(f -> f.getAbnormalType() != AbnormalType.NORMAL)
                .count();

        if (total > 0) {
            stats.put("abnormalRate", BigDecimal.valueOf(abnormalCount * 100.0 / total)
                    .setScale(1, RoundingMode.HALF_UP) + "%");
        } else {
            stats.put("abnormalRate", "0%");
        }
        stats.put("abnormalCount", abnormalCount);

        Map<String, Object> abnormalCounts = (Map<String, Object>) stats.get("abnormalCounts");
        long materialMissingCount = abnormalCounts.containsKey("MATERIAL_MISSING") ?
                ((Long) abnormalCounts.get("MATERIAL_MISSING")) : 0L;
        long responsibilityMismatchCount = abnormalCounts.containsKey("RESPONSIBILITY_MISMATCH") ?
                ((Long) abnormalCounts.get("RESPONSIBILITY_MISMATCH")) : 0L;
        long reviewRejectedCount = abnormalCounts.containsKey("REVIEW_REJECTED") ?
                ((Long) abnormalCounts.get("REVIEW_REJECTED")) : 0L;

        stats.put("topAbnormalType", materialMissingCount >= responsibilityMismatchCount &&
                materialMissingCount >= reviewRejectedCount ? "关键材料缺失" :
                (responsibilityMismatchCount >= reviewRejectedCount ? "责任对象不一致" : "复核退回"));
    }

    public List<FilmReissue> getApplicationsByStatus(String status) {
        return filmReissueRepository.findByStatus(ApplicationStatus.valueOf(status));
    }

    public List<FilmReissue> getApplicationsByAbnormalType(String abnormalType) {
        return filmReissueRepository.findByAbnormalType(AbnormalType.valueOf(abnormalType));
    }
}
