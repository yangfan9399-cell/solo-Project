package com.hospital.film.service;

import com.hospital.film.entity.FilmReissue;
import com.hospital.film.enums.AbnormalType;
import com.hospital.film.enums.ApplicationStatus;
import com.hospital.film.repository.FilmReissueRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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

        return stats;
    }

    public List<FilmReissue> getApplicationsByStatus(String status) {
        return filmReissueRepository.findByStatus(ApplicationStatus.valueOf(status));
    }

    public List<FilmReissue> getApplicationsByAbnormalType(String abnormalType) {
        return filmReissueRepository.findByAbnormalType(AbnormalType.valueOf(abnormalType));
    }
}
