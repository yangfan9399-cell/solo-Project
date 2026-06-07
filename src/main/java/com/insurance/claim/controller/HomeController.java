package com.insurance.claim.controller;

import com.insurance.claim.service.StatisticsService;
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
        model.addAttribute("statusStats", statisticsService.getCaseStatusStats());
        return "index";
    }
}
