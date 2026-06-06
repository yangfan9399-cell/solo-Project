package com.manufacturing.fixture.service;

import com.manufacturing.fixture.entity.BorrowRecord;
import com.manufacturing.fixture.entity.BorrowStatus;
import com.manufacturing.fixture.entity.DamageRecord;
import com.manufacturing.fixture.repository.BorrowRecordRepository;
import com.manufacturing.fixture.repository.CalibrationRecordRepository;
import com.manufacturing.fixture.repository.DamageRecordRepository;
import com.manufacturing.fixture.repository.FixtureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final FixtureRepository fixtureRepository;
    private final BorrowRecordRepository borrowRecordRepository;
    private final DamageRecordRepository damageRecordRepository;
    private final CalibrationRecordRepository calibrationRecordRepository;

    public Map<String, Object> getOverview() {
        Map<String, Object> overview = new HashMap<>();
        overview.put("totalFixtures", fixtureRepository.count());
        overview.put("fixtureTypeStats", fixtureRepository.countByFixtureType());
        overview.put("fixtureStatusStats", fixtureRepository.countByStatus());

        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime endOfMonth = LocalDateTime.now();

        overview.put("monthlyBorrowCount", borrowRecordRepository.countByStatusInAndBorrowDateBetween(
                List.of(BorrowStatus.values()), startOfMonth, endOfMonth));

        return overview;
    }

    public Map<String, Object> getAnalysisByProductionLine(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();

        List<Object[]> borrowByLine = borrowRecordRepository.countByProductionLine(startDate, endDate);
        result.put("borrowByLine", borrowByLine);

        List<Object[]> damageByLine = damageRecordRepository.countByProductionLineAndDateRange(startDate, endDate);
        result.put("damageByLine", damageByLine);

        return result;
    }

    public Map<String, Object> getAnalysisByFixtureType() {
        Map<String, Object> result = new HashMap<>();
        result.put("fixtureTypeStats", fixtureRepository.countByFixtureType());
        return result;
    }

    public Map<String, Object> getAnalysisByExceptionCause(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();

        List<Object[]> damageByType = damageRecordRepository.countByDamageTypeAndDateRange(startDate, endDate);
        result.put("damageByType", damageByType);

        List<Object[]> borrowStatusStats = borrowRecordRepository.countByStatusAndDateRange(startDate, endDate);
        result.put("borrowStatusStats", borrowStatusStats);

        List<Object[]> calibrationStats = calibrationRecordRepository.countByResultAndDateRange(startDate, endDate);
        result.put("calibrationStats", calibrationStats);

        return result;
    }

    public Map<String, Object> getAnalysisByDowntimeImpact(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> result = new HashMap<>();

        Integer totalDowntime = damageRecordRepository.sumDowntimeHours(startDate, endDate);
        result.put("totalDowntimeHours", totalDowntime != null ? totalDowntime : 0);

        List<Object[]> downtimeByLine = damageRecordRepository.countByProductionLineAndDateRange(startDate, endDate);
        result.put("downtimeByLine", downtimeByLine);

        List<Object[]> downtimeByDamageType = damageRecordRepository.countByDamageTypeAndDateRange(startDate, endDate);
        result.put("downtimeByDamageType", downtimeByDamageType);

        List<DamageRecord> damageRecords = damageRecordRepository.findByOccurrenceTimeBetween(startDate, endDate);
        result.put("damageRecords", damageRecords);

        return result;
    }

    public List<BorrowRecord> getBorrowRecordsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return borrowRecordRepository.findByBorrowDateBetween(startDate, endDate);
    }

    public List<DamageRecord> getDamageRecordsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return damageRecordRepository.findByOccurrenceTimeBetween(startDate, endDate);
    }
}
