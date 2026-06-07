package com.insurance.claim.controller;

import com.insurance.claim.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping
    public String index(Model model) {
        model.addAttribute("statusStats", statisticsService.getCaseStatusStats());
        model.addAttribute("insuranceTypeStats", statisticsService.getStatsByInsuranceType());
        model.addAttribute("missingMaterialStats", statisticsService.getMissingMaterialStats());
        model.addAttribute("rejectReasonStats", statisticsService.getRejectReasonStats());
        model.addAttribute("durationStats", statisticsService.getReviewDurationStats());
        return "statistics/index";
    }
}
