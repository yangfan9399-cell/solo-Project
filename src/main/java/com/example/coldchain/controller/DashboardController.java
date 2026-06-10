package com.example.coldchain.controller;

import com.example.coldchain.entity.*;
import com.example.coldchain.enums.DisposalStatus;
import com.example.coldchain.enums.ExceptionType;
import com.example.coldchain.enums.ProductType;
import com.example.coldchain.enums.WaybillStatus;
import com.example.coldchain.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final WaybillService waybillService;
    private final ExceptionService exceptionService;
    private final CompensationService compensationService;
    private final DisposalService disposalService;

    @GetMapping
    public String dashboard(Model model) {
        List<Waybill> allWaybills = waybillService.findAll();
        List<ExceptionRecord> allExceptions = exceptionService.findByType(null);

        // 线路统计
        Map<String, Long> routeStats = allWaybills.stream()
                .collect(Collectors.groupingBy(w -> w.getOrigin() + " -> " + w.getDestination(), Collectors.counting()));

        // 货品类型统计
        Map<ProductType, Long> productTypeStats = allWaybills.stream()
                .collect(Collectors.groupingBy(Waybill::getProductType, Collectors.counting()));

        // 异常类型统计
        Map<ExceptionType, Long> exceptionTypeStats = allExceptions.stream()
                .collect(Collectors.groupingBy(ExceptionRecord::getExceptionType, Collectors.counting()));

        // 运单状态统计
        Map<WaybillStatus, Long> statusStats = allWaybills.stream()
                .collect(Collectors.groupingBy(Waybill::getStatus, Collectors.counting()));

        // 处置时长统计
        List<DisposalRecord> completedDisposals = disposalService.findCompletedDisposals();
        Map<String, Long> disposalDurationStats = calculateDisposalDurationStats(completedDisposals);

        long pendingAssessments = compensationService.findPendingAssessments().size();
        long pendingReviews = compensationService.findPendingReviews().size();

        List<Waybill> abnormalWaybills = waybillService.findAbnormalWaybills();

        model.addAttribute("routeStats", routeStats);
        model.addAttribute("productTypeStats", productTypeStats);
        model.addAttribute("exceptionTypeStats", exceptionTypeStats);
        model.addAttribute("statusStats", statusStats);
        model.addAttribute("disposalDurationStats", disposalDurationStats);
        model.addAttribute("pendingAssessments", pendingAssessments);
        model.addAttribute("pendingReviews", pendingReviews);
        model.addAttribute("abnormalWaybills", abnormalWaybills);

        return "dashboard/index";
    }

    private Map<String, Long> calculateDisposalDurationStats(List<DisposalRecord> disposals) {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("0-1小时", 0L);
        stats.put("1-2小时", 0L);
        stats.put("2-4小时", 0L);
        stats.put("4-8小时", 0L);
        stats.put("8小时以上", 0L);

        for (DisposalRecord disposal : disposals) {
            if (disposal.getDisposalTime() != null && disposal.getCreatedAt() != null) {
                long minutes = Duration.between(disposal.getCreatedAt(), disposal.getDisposalTime()).toMinutes();
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
        return stats;
    }
}