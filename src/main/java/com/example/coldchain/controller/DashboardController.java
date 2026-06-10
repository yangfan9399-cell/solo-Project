package com.example.coldchain.controller;

import com.example.coldchain.entity.*;
import com.example.coldchain.enums.ExceptionType;
import com.example.coldchain.enums.ProductType;
import com.example.coldchain.enums.WaybillStatus;
import com.example.coldchain.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final WaybillService waybillService;
    private final ExceptionService exceptionService;
    private final CompensationService compensationService;

    @GetMapping
    public String dashboard(Model model) {
        List<Waybill> allWaybills = waybillService.findAll();
        List<ExceptionRecord> allExceptions = exceptionService.findByType(null);

        Map<String, Long> routeStats = allWaybills.stream()
                .collect(Collectors.groupingBy(w -> w.getOrigin() + " -> " + w.getDestination(), Collectors.counting()));

        Map<ProductType, Long> productTypeStats = allWaybills.stream()
                .collect(Collectors.groupingBy(Waybill::getProductType, Collectors.counting()));

        Map<ExceptionType, Long> exceptionTypeStats = allExceptions.stream()
                .collect(Collectors.groupingBy(ExceptionRecord::getExceptionType, Collectors.counting()));

        Map<WaybillStatus, Long> statusStats = allWaybills.stream()
                .collect(Collectors.groupingBy(Waybill::getStatus, Collectors.counting()));

        long pendingAssessments = compensationService.findPendingAssessments().size();
        long pendingReviews = compensationService.findPendingReviews().size();

        List<Waybill> abnormalWaybills = waybillService.findAbnormalWaybills();

        model.addAttribute("routeStats", routeStats);
        model.addAttribute("productTypeStats", productTypeStats);
        model.addAttribute("exceptionTypeStats", exceptionTypeStats);
        model.addAttribute("statusStats", statusStats);
        model.addAttribute("pendingAssessments", pendingAssessments);
        model.addAttribute("pendingReviews", pendingReviews);
        model.addAttribute("abnormalWaybills", abnormalWaybills);

        return "dashboard/index";
    }
}