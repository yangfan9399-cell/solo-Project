package com.example.marketstall.controller;

import com.example.marketstall.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class DashboardController {

    private final StallService stallService;
    private final TenantService tenantService;
    private final PaymentRecordService paymentRecordService;
    private final ViolationRecordService violationRecordService;
    private final LicenseService licenseService;
    private final UserService userService;

    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        com.example.marketstall.entity.User user = userService.getUserByUsername(username);
        
        model.addAttribute("user", user);
        
        Map<String, Long> stallByArea = stallService.countByArea();
        Map<String, Long> stallByCategory = stallService.countByCategory();
        Map<String, Long> stallByStatus = stallService.countByStatus();
        Map<String, Long> violationByType = violationRecordService.countByViolationType();
        
        model.addAttribute("stallByArea", stallByArea);
        model.addAttribute("stallByCategory", stallByCategory);
        model.addAttribute("stallByStatus", stallByStatus);
        model.addAttribute("violationByType", violationByType);
        model.addAttribute("overdueByDays", paymentRecordService.countOverdueDaysDistribution());
        
        model.addAttribute("totalStalls", stallService.getAllStalls().size());
        model.addAttribute("totalTenants", tenantService.getAllTenants().size());
        model.addAttribute("pendingPayments", paymentRecordService.getPendingPayments().size());
        model.addAttribute("pendingViolations", violationRecordService.getPendingViolations().size());
        model.addAttribute("expiredLicenses", licenseService.getExpiredLicenses().size());
        
        return "dashboard";
    }
}