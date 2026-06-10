package com.example.contract.service;

import com.example.contract.entity.Contract;
import com.example.contract.entity.SigningRecord;
import com.example.contract.enums.ContractStatus;
import com.example.contract.enums.FailureReason;
import com.example.contract.repository.ContractRepository;
import com.example.contract.repository.SigningRecordRepository;
import com.example.contract.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final ContractRepository contractRepository;
    private final SigningRecordRepository signingRecordRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getDepartmentStatistics() {
        Map<String, Object> result = new HashMap<>();
        
        List<Contract> allContracts = contractRepository.findAll();
        
        Map<String, Long> departmentCount = allContracts.stream()
                .collect(Collectors.groupingBy(c -> {
                    return userRepository.findById(c.getOperatorId())
                            .map(u -> u.getDepartment())
                            .orElse("未知部门");
                }, Collectors.counting()));
        
        Map<String, Long> departmentFailedCount = allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.FAILED)
                .collect(Collectors.groupingBy(c -> {
                    return userRepository.findById(c.getOperatorId())
                            .map(u -> u.getDepartment())
                            .orElse("未知部门");
                }, Collectors.counting()));
        
        result.put("departmentCount", departmentCount);
        result.put("departmentFailedCount", departmentFailedCount);
        
        return result;
    }

    public Map<String, Object> getContractTypeStatistics() {
        Map<String, Object> result = new HashMap<>();
        
        List<Contract> allContracts = contractRepository.findAll();
        
        Map<String, Long> typeCount = allContracts.stream()
                .collect(Collectors.groupingBy(Contract::getContractType, Collectors.counting()));
        
        Map<String, Long> typeFailedCount = allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.FAILED)
                .collect(Collectors.groupingBy(Contract::getContractType, Collectors.counting()));
        
        result.put("typeCount", typeCount);
        result.put("typeFailedCount", typeFailedCount);
        
        return result;
    }

    public Map<String, Object> getFailureReasonStatistics() {
        Map<String, Object> result = new HashMap<>();
        
        List<SigningRecord> failedRecords = signingRecordRepository.findFailedRecords();
        
        Map<FailureReason, Long> reasonCount = failedRecords.stream()
                .filter(r -> r.getFailureReason() != null)
                .collect(Collectors.groupingBy(SigningRecord::getFailureReason, Collectors.counting()));
        
        Map<String, Long> reasonCountStr = new HashMap<>();
        reasonCount.forEach((k, v) -> reasonCountStr.put(k.getDescription(), v));
        
        result.put("reasonCount", reasonCountStr);
        
        return result;
    }

    public Map<String, Object> getRetryDurationStatistics() {
        Map<String, Object> result = new HashMap<>();
        
        List<SigningRecord> allRecords = signingRecordRepository.findAll();
        
        Map<Long, List<SigningRecord>> contractRecords = allRecords.stream()
                .collect(Collectors.groupingBy(SigningRecord::getContractId));
        
        List<Long> durations = new ArrayList<>();
        
        for (List<SigningRecord> records : contractRecords.values()) {
            if (records.size() >= 2) {
                List<SigningRecord> sorted = records.stream()
                        .sorted(Comparator.comparing(SigningRecord::getCreatedAt))
                        .collect(Collectors.toList());
                
                for (int i = 1; i < sorted.size(); i++) {
                    LocalDateTime prev = sorted.get(i - 1).getCreatedAt();
                    LocalDateTime curr = sorted.get(i).getCreatedAt();
                    long hours = java.time.Duration.between(prev, curr).toHours();
                    durations.add(hours);
                }
            }
        }
        
        Map<String, Long> durationDistribution = new HashMap<>();
        durationDistribution.put("0-2小时", durations.stream().filter(d -> d <= 2).count());
        durationDistribution.put("2-8小时", durations.stream().filter(d -> d > 2 && d <= 8).count());
        durationDistribution.put("8-24小时", durations.stream().filter(d -> d > 8 && d <= 24).count());
        durationDistribution.put("24小时以上", durations.stream().filter(d -> d > 24).count());
        
        result.put("durationDistribution", durationDistribution);
        
        if (!durations.isEmpty()) {
            double avg = durations.stream().mapToLong(Long::longValue).average().orElse(0);
            result.put("averageHours", avg);
        }
        
        return result;
    }

    public Map<String, Object> getOverallStatistics() {
        Map<String, Object> result = new HashMap<>();
        
        List<Contract> allContracts = contractRepository.findAll();
        List<SigningRecord> allRecords = signingRecordRepository.findAll();
        
        long totalContracts = allContracts.size();
        long signedCount = allContracts.stream().filter(c -> c.getStatus() == ContractStatus.SIGNED).count();
        long failedCount = allContracts.stream().filter(c -> c.getStatus() == ContractStatus.FAILED).count();
        long revokedCount = allContracts.stream().filter(c -> c.getStatus() == ContractStatus.REVOKED).count();
        long preservedCount = allContracts.stream().filter(c -> c.getStatus() == ContractStatus.EVIDENCE_PRESERVED).count();
        
        long retryCount = allRecords.stream().filter(r -> r.getRetryCount() > 0).count();
        
        result.put("totalContracts", totalContracts);
        result.put("signedCount", signedCount);
        result.put("failedCount", failedCount);
        result.put("revokedCount", revokedCount);
        result.put("preservedCount", preservedCount);
        result.put("retryCount", retryCount);
        result.put("successRate", totalContracts > 0 ? (double) signedCount / totalContracts * 100 : 0);
        
        return result;
    }
}