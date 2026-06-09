package com.fire.inspection.controller;

import com.fire.inspection.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final StatisticsService statisticsService;

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("totalCount", statisticsService.getTotalCount());
        model.addAttribute("acceptedCount", statisticsService.getAcceptedCount());
        model.addAttribute("overdueCount", statisticsService.getOverdueCount());
        model.addAttribute("statusStats", statisticsService.getStatusStatistics());
        return "index";
    }
}
