package com.hotel.maintenance.controller;

import com.hotel.maintenance.service.MaintenanceOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/")
@RequiredArgsConstructor
public class HomeController {

    private final MaintenanceOrderService maintenanceOrderService;

    @GetMapping
    public String index(Model model) {
        model.addAttribute("activeMenu", "home");
        model.addAttribute("dashboardStats", maintenanceOrderService.getDashboardStats());
        model.addAttribute("recentOrders", maintenanceOrderService.findAll());
        return "index";
    }
}
