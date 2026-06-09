package com.bank.due.diligence.controller;

import com.bank.due.diligence.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping
    public String statistics(Model model) {
        List<Map<String, Object>> branchStats = statisticsService.getBranchStatistics();
        List<Map<String, Object>> industryStats = statisticsService.getIndustryStatistics();
        List<Map<String, Object>> statusStats = statisticsService.getStatusStatistics();
        List<Map<String, Object>> returnReasonStats = statisticsService.getReturnReasonStatistics();
        Map<String, Object> cycleStats = statisticsService.getAccountOpeningCycle();
        Map<String, Object> summary = statisticsService.getDashboardSummary();

        model.addAttribute("branchStats", branchStats);
        model.addAttribute("industryStats", industryStats);
        model.addAttribute("statusStats", statusStats);
        model.addAttribute("returnReasonStats", returnReasonStats);
        model.addAttribute("cycleStats", cycleStats);
        model.addAttribute("summary", summary);

        return "statistics/index";
    }
}
