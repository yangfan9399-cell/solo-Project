package com.insurance.claim.service;

import com.insurance.claim.entity.*;
import com.insurance.claim.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final ClaimCaseRepository claimCaseRepository;
    private final PolicyRepository policyRepository;
    private final ClaimMaterialRepository materialRepository;
    private final ClaimReviewRepository reviewRepository;
    private final ClaimHistoryRepository historyRepository;
    private final MaterialTypeRepository materialTypeRepository;

    public Map<String, Long> getCaseStatusStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("已登记", claimCaseRepository.countByStatus("REGISTERED"));
        stats.put("待核赔", claimCaseRepository.countByStatus("PENDING_REVIEW"));
        stats.put("材料缺失", claimCaseRepository.countByStatus("MATERIAL_MISSING"));
        stats.put("已赔付", claimCaseRepository.countByStatus("APPROVED"));
        stats.put("已拒赔", claimCaseRepository.countByStatus("REJECTED"));
        stats.put("已退回", claimCaseRepository.countByStatus("RETURNED"));
        stats.put("已冻结", claimCaseRepository.findAll().stream().filter(ClaimCase::getFrozen).count());
        return stats;
    }

    public Map<String, Map<String, Object>> getStatsByInsuranceType() {
        Map<String, Map<String, Object>> result = new LinkedHashMap<>();
        List<ClaimCase> allCases = claimCaseRepository.findAll();

        Map<Long, String> policyTypeMap = new HashMap<>();
        for (Policy policy : policyRepository.findAll()) {
            policyTypeMap.put(policy.getId(), policy.getInsuranceType());
        }

        Map<String, List<ClaimCase>> groupedByType = allCases.stream()
                .collect(Collectors.groupingBy(c -> policyTypeMap.getOrDefault(c.getPolicyId(), "未知")));

        for (Map.Entry<String, List<ClaimCase>> entry : groupedByType.entrySet()) {
            String type = entry.getKey();
            List<ClaimCase> cases = entry.getValue();

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("totalCount", cases.size());
            stats.put("approvedCount", cases.stream().filter(c -> "APPROVED".equals(c.getStatus())).count());
            stats.put("rejectedCount", cases.stream().filter(c -> "REJECTED".equals(c.getStatus())).count());

            BigDecimal totalClaim = cases.stream()
                    .map(ClaimCase::getClaimAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            stats.put("totalClaimAmount", totalClaim);

            BigDecimal totalApproved = reviewRepository.findAll().stream()
                    .filter(r -> "APPROVED".equals(r.getReviewResult()))
                    .filter(r -> cases.stream().anyMatch(c -> c.getId().equals(r.getClaimCaseId())))
                    .map(ClaimReview::getApprovedAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            stats.put("totalApprovedAmount", totalApproved);

            result.put(type, stats);
        }

        return result;
    }

    public Map<String, Long> getMissingMaterialStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        List<ClaimMaterial> missingMaterials = materialRepository.findAll().stream()
                .filter(m -> "MISSING".equals(m.getStatus()))
                .collect(Collectors.toList());

        Map<Long, String> materialTypeMap = new HashMap<>();
        for (MaterialType mt : materialTypeRepository.findAll()) {
            materialTypeMap.put(mt.getId(), mt.getTypeName());
        }

        Map<String, Long> grouped = missingMaterials.stream()
                .collect(Collectors.groupingBy(
                        m -> materialTypeMap.getOrDefault(m.getMaterialTypeId(), "其他"),
                        Collectors.counting()
                ));

        List<Map.Entry<String, Long>> sorted = new ArrayList<>(grouped.entrySet());
        sorted.sort((a, b) -> Long.compare(b.getValue(), a.getValue()));

        for (Map.Entry<String, Long> entry : sorted) {
            stats.put(entry.getKey(), entry.getValue());
        }

        return stats;
    }

    public Map<String, Long> getRejectReasonStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        List<ClaimReview> rejectedReviews = reviewRepository.findAll().stream()
                .filter(r -> "REJECTED".equals(r.getReviewResult()))
                .filter(r -> r.getRejectReason() != null && !r.getRejectReason().isEmpty())
                .collect(Collectors.toList());

        Map<String, Long> grouped = rejectedReviews.stream()
                .collect(Collectors.groupingBy(ClaimReview::getRejectReason, Collectors.counting()));

        List<Map.Entry<String, Long>> sorted = new ArrayList<>(grouped.entrySet());
        sorted.sort((a, b) -> Long.compare(b.getValue(), a.getValue()));

        for (Map.Entry<String, Long> entry : sorted) {
            stats.put(entry.getKey(), entry.getValue());
        }

        return stats;
    }

    public Map<String, Object> getReviewDurationStats() {
        Map<String, Object> result = new LinkedHashMap<>();
        List<ClaimCase> completedCases = claimCaseRepository.findAll().stream()
                .filter(c -> "APPROVED".equals(c.getStatus()) || "REJECTED".equals(c.getStatus()))
                .collect(Collectors.toList());

        List<Long> durationsHours = new ArrayList<>();

        for (ClaimCase claimCase : completedCases) {
            List<ClaimHistory> history = historyRepository.findByClaimCaseIdOrderByOperationTimeAsc(claimCase.getId());

            LocalDateTime registerTime = claimCase.getRegisterTime();
            LocalDateTime completeTime = history.stream()
                    .filter(h -> "APPROVE".equals(h.getOperationType()) || "REJECT".equals(h.getOperationType()))
                    .map(ClaimHistory::getOperationTime)
                    .findFirst()
                    .orElse(null);

            if (registerTime != null && completeTime != null) {
                long hours = Duration.between(registerTime, completeTime).toHours();
                durationsHours.add(hours);
            }
        }

        if (durationsHours.isEmpty()) {
            result.put("count", 0);
            result.put("avgHours", 0);
            result.put("minHours", 0);
            result.put("maxHours", 0);
            return result;
        }

        Collections.sort(durationsHours);
        long sum = durationsHours.stream().mapToLong(Long::longValue).sum();
        result.put("count", durationsHours.size());
        result.put("avgHours", sum / durationsHours.size());
        result.put("minHours", durationsHours.get(0));
        result.put("maxHours", durationsHours.get(durationsHours.size() - 1));

        Map<String, Long> distribution = new LinkedHashMap<>();
        distribution.put("24小时内", durationsHours.stream().filter(h -> h <= 24).count());
        distribution.put("1-3天", durationsHours.stream().filter(h -> h > 24 && h <= 72).count());
        distribution.put("3-7天", durationsHours.stream().filter(h -> h > 72 && h <= 168).count());
        distribution.put("7天以上", durationsHours.stream().filter(h -> h > 168).count());
        result.put("distribution", distribution);

        return result;
    }

    public List<ClaimCase> getCasesByDateRange(LocalDate startDate, LocalDate endDate) {
        return claimCaseRepository.findByAccidentDateBetween(startDate, endDate);
    }
}
