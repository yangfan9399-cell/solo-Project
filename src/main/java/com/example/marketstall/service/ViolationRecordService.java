package com.example.marketstall.service;

import com.example.marketstall.entity.ViolationRecord;
import com.example.marketstall.repository.ViolationRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ViolationRecordService {

    private final ViolationRecordRepository violationRecordRepository;

    public List<ViolationRecord> getAllViolationRecords() {
        return violationRecordRepository.findAll();
    }

    public ViolationRecord getViolationRecordById(Long id) {
        return violationRecordRepository.findById(id).orElse(null);
    }

    public List<ViolationRecord> getViolationRecordsByStallId(Long stallId) {
        return violationRecordRepository.findByStallId(stallId);
    }

    public ViolationRecord saveViolationRecord(ViolationRecord record) {
        return violationRecordRepository.save(record);
    }

    public void deleteViolationRecord(Long id) {
        violationRecordRepository.deleteById(id);
    }

    public void recordViolation(Long stallId, String violationType, String description, int points, String inspector) {
        ViolationRecord record = new ViolationRecord();
        record.setStallId(stallId);
        record.setViolationType(violationType);
        record.setDescription(description);
        record.setPointsDeducted(points);
        record.setInspector(inspector);
        record.setStatus("pending");
        violationRecordRepository.save(record);
    }

    public void reviewViolation(Long id, String status, String remark) {
        ViolationRecord record = violationRecordRepository.findById(id).orElse(null);
        if (record != null) {
            record.setStatus(status);
            record.setSupervisorRemark(remark);
            if ("rectified".equals(status)) {
                record.setRectifiedAt(LocalDate.now());
            }
            violationRecordRepository.save(record);
        }
    }

    public void suspendLease(Long stallId, String remark) {
        List<ViolationRecord> records = violationRecordRepository.findByStallId(stallId);
        for (ViolationRecord record : records) {
            if ("pending".equals(record.getStatus())) {
                record.setStatus("suspended");
                record.setSupervisorRemark(remark);
                violationRecordRepository.save(record);
            }
        }
    }

    public List<ViolationRecord> getPendingViolations() {
        return violationRecordRepository.findByStatus("pending");
    }

    public Map<String, Long> countByViolationType() {
        return violationRecordRepository.countByViolationType().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    public Map<Long, Integer> getTotalPointsByStall() {
        return violationRecordRepository.sumPointsByStallId().stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Integer) row[1]
                ));
    }
}