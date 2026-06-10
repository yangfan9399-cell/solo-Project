package com.example.coldchain.controller;

import com.example.coldchain.entity.*;
import com.example.coldchain.enums.ExceptionType;
import com.example.coldchain.enums.ProductType;
import com.example.coldchain.enums.WaybillStatus;
import com.example.coldchain.repository.ExceptionRecordRepository;
import com.example.coldchain.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final WaybillService waybillService;
    private final ExceptionRecordRepository exceptionRecordRepository;
    private final CompensationService compensationService;
    private final DisposalService disposalService;

    @GetMapping
    public String dashboard(Model model) {
        List<Waybill> allWaybills = waybillService.findAll();
        List<ExceptionRecord> allExceptions = exceptionRecordRepository.findAll();
        List<DisposalRecord> allDisposals = disposalService.findAllDisposals();

        // 运单状态统计
        Map<WaybillStatus, Long> statusStats = allWaybills.stream()
                .collect(Collectors.groupingBy(Waybill::getStatus, Collectors.counting()));

        // 运单数量统计
        long inTransitCount = statusStats.getOrDefault(WaybillStatus.IN_TRANSIT, 0L);
        long exceptionCount = statusStats.getOrDefault(WaybillStatus.EXCEPTION, 0L);

        // 线路统计
        Map<String, Long> routeStats = allWaybills.stream()
                .collect(Collectors.groupingBy(w -> w.getOrigin() + " -> " + w.getDestination(), Collectors.counting()));

        // 货品类型统计
        Map<ProductType, Long> productTypeStats = allWaybills.stream()
                .collect(Collectors.groupingBy(Waybill::getProductType, Collectors.counting()));

        // 异常类型统计
        Map<ExceptionType, Long> exceptionTypeStats = allExceptions.stream()
                .collect(Collectors.groupingBy(ExceptionRecord::getExceptionType, Collectors.counting()));

        // 处置时长统计：从异常发生到处置完成的时长
        Map<String, Long> disposalDurationStats = calculateDisposalDurationStats(allExceptions, allDisposals);

        long pendingAssessmentsCount = compensationService.findPendingAssessments().size();
        long pendingReviewsCount = compensationService.findPendingReviews().size();

        List<Waybill> abnormalWaybills = waybillService.findAbnormalWaybills();

        model.addAttribute("inTransitCount", inTransitCount);
        model.addAttribute("exceptionCount", exceptionCount);
        model.addAttribute("routeStats", routeStats);
        model.addAttribute("productTypeStats", productTypeStats);
        model.addAttribute("exceptionTypeStats", exceptionTypeStats);
        model.addAttribute("disposalDurationStats", disposalDurationStats);
        model.addAttribute("pendingAssessments", pendingAssessmentsCount);
        model.addAttribute("pendingReviews", pendingReviewsCount);
        model.addAttribute("abnormalWaybills", abnormalWaybills);

        return "dashboard/index";
    }

    /**
     * 计算处置时长：从异常发生(ExceptionRecord.exceptionTime)到处置完成(DisposalRecord.disposalTime)
     */
    private Map<String, Long> calculateDisposalDurationStats(List<ExceptionRecord> exceptions, List<DisposalRecord> disposals) {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("0-1小时", 0L);
        stats.put("1-2小时", 0L);
        stats.put("2-4小时", 0L);
        stats.put("4-8小时", 0L);
        stats.put("8小时以上", 0L);

        Map<Long, ExceptionRecord> exceptionMap = exceptions.stream()
                .collect(Collectors.toMap(ExceptionRecord::getId, e -> e));

        for (DisposalRecord disposal : disposals) {
            if ("COMPLETED".equals(disposal.getStatus().name()) && disposal.getDisposalTime() != null) {
                ExceptionRecord exception = exceptionMap.get(disposal.getExceptionId());
                if (exception != null && exception.getExceptionTime() != null) {
                    long minutes = Duration.between(exception.getExceptionTime(), disposal.getDisposalTime()).toMinutes();
                    if (minutes <= 60) {
                        stats.put("0-1小时", stats.get("0-1小时") + 1);
                    } else if (minutes <= 120) {
                        stats.put("1-2小时", stats.get("1-2小时") + 1);
                    } else if (minutes <= 240) {
                        stats.put("2-4小时", stats.get("2-4小时") + 1);
                    } else if (minutes <= 480) {
                        stats.put("4-8小时", stats.get("4-8小时") + 1);
                    } else {
                        stats.put("8小时以上", stats.get("8小时以上") + 1);
                    }
                }
            }
        }
        return stats;
    }
}