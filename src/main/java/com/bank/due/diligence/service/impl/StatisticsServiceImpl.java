package com.bank.due.diligence.service.impl;

import com.bank.due.diligence.entity.AccountApplication;
import com.bank.due.diligence.entity.ApplicationHistory;
import com.bank.due.diligence.enums.ApplicationStatus;
import com.bank.due.diligence.repository.AccountApplicationRepository;
import com.bank.due.diligence.repository.ApplicationHistoryRepository;
import com.bank.due.diligence.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final AccountApplicationRepository applicationRepository;
    private final ApplicationHistoryRepository historyRepository;

    @Override
    public List<Map<String, Object>> getBranchStatistics() {
        List<Object[]> results = applicationRepository.countByBranch();
        List<Map<String, Object>> statistics = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("branchName", row[0]);
            map.put("count", row[1]);
            statistics.add(map);
        }

        return statistics;
    }

    @Override
    public List<Map<String, Object>> getIndustryStatistics() {
        List<Object[]> results = applicationRepository.countByIndustry();
        List<Map<String, Object>> statistics = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("industry", row[0]);
            map.put("count", row[1]);
            statistics.add(map);
        }

        return statistics;
    }

    @Override
    public List<Map<String, Object>> getStatusStatistics() {
        List<Object[]> results = applicationRepository.countByStatus();
        List<Map<String, Object>> statistics = new ArrayList<>();

        for (Object[] row : results) {
            ApplicationStatus status = (ApplicationStatus) row[0];
            Map<String, Object> map = new HashMap<>();
            map.put("status", status.name());
            map.put("statusName", status.getDescription());
            map.put("count", row[1]);
            statistics.add(map);
        }

        return statistics;
    }

    @Override
    public List<Map<String, Object>> getReturnReasonStatistics() {
        List<AccountApplication> returnedApps = applicationRepository.findByStatusIn(
                Arrays.asList(ApplicationStatus.MATERIAL_DEFICIENT, ApplicationStatus.RETURNED,
                        ApplicationStatus.ADDRESS_VERIFICATION_FAILED, ApplicationStatus.REJECTED)
        );

        Map<String, Long> reasonCount = new HashMap<>();

        for (AccountApplication app : returnedApps) {
            String reason = "其他";
            if (app.getStatus() == ApplicationStatus.MATERIAL_DEFICIENT) {
                reason = app.getReturnReason() != null ? app.getReturnReason() : "材料缺失";
            } else if (app.getStatus() == ApplicationStatus.ADDRESS_VERIFICATION_FAILED) {
                reason = "地址核验失败";
            } else if (app.getStatus() == ApplicationStatus.RETURNED) {
                reason = app.getReturnReason() != null ? app.getReturnReason() : "主管退回";
            } else if (app.getStatus() == ApplicationStatus.REJECTED) {
                reason = app.getRejectReason() != null ? app.getRejectReason() : "拒绝开户";
            }

            reasonCount.merge(reason, 1L, Long::sum);
        }

        List<Map<String, Object>> statistics = new ArrayList<>();
        for (Map.Entry<String, Long> entry : reasonCount.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("reason", entry.getKey());
            map.put("count", entry.getValue());
            statistics.add(map);
        }

        statistics.sort((a, b) -> Long.compare((Long) b.get("count"), (Long) a.get("count")));
        return statistics;
    }

    @Override
    public Map<String, Object> getAccountOpeningCycle() {
        List<AccountApplication> approvedApps = applicationRepository.findByStatus(ApplicationStatus.APPROVED);

        if (approvedApps.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("totalApproved", 0);
            result.put("avgDays", 0.0);
            result.put("minDays", 0.0);
            result.put("maxDays", 0.0);
            result.put("cycleDetails", new ArrayList<>());
            return result;
        }

        List<Double> cycles = new ArrayList<>();
        List<Map<String, Object>> cycleDetails = new ArrayList<>();

        for (AccountApplication app : approvedApps) {
            if (app.getSubmitTime() != null && app.getApprovalTime() != null) {
                long hours = Duration.between(app.getSubmitTime(), app.getApprovalTime()).toHours();
                double days = hours / 24.0;
                days = Math.round(days * 100.0) / 100.0;
                cycles.add(days);

                Map<String, Object> detail = new HashMap<>();
                detail.put("applicationNo", app.getApplicationNo());
                detail.put("enterpriseName", app.getEnterprise().getEnterpriseName());
                detail.put("submitTime", app.getSubmitTime());
                detail.put("approvalTime", app.getApprovalTime());
                detail.put("days", days);
                cycleDetails.add(detail);
            }
        }

        double avgDays = cycles.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double minDays = cycles.stream().mapToDouble(Double::doubleValue).min().orElse(0.0);
        double maxDays = cycles.stream().mapToDouble(Double::doubleValue).max().orElse(0.0);

        avgDays = Math.round(avgDays * 100.0) / 100.0;
        minDays = Math.round(minDays * 100.0) / 100.0;
        maxDays = Math.round(maxDays * 100.0) / 100.0;

        Map<String, Object> result = new HashMap<>();
        result.put("totalApproved", cycles.size());
        result.put("avgDays", avgDays);
        result.put("minDays", minDays);
        result.put("maxDays", maxDays);
        result.put("cycleDetails", cycleDetails);

        return result;
    }

    @Override
    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();

        List<AccountApplication> allApps = applicationRepository.findAll();
        int total = allApps.size();
        int pending = (int) allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING_OPERATION).count();
        int inRisk = (int) allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING_RISK).count();
        int approved = (int) allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED).count();
        int rejected = (int) allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
        int addressFailed = (int) allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.ADDRESS_VERIFICATION_FAILED).count();
        int materialDeficient = (int) allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.MATERIAL_DEFICIENT).count();

        summary.put("totalApplications", total);
        summary.put("pendingOperation", pending);
        summary.put("pendingRisk", inRisk);
        summary.put("approved", approved);
        summary.put("rejected", rejected);
        summary.put("addressVerificationFailed", addressFailed);
        summary.put("materialDeficient", materialDeficient);

        double approvalRate = total > 0 ? (double) approved / total * 100 : 0;
        summary.put("approvalRate", Math.round(approvalRate * 100.0) / 100.0);

        return summary;
    }
}
