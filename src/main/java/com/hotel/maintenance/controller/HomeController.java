package com.hotel.maintenance.controller;

import com.hotel.maintenance.dto.MaintenanceOrderListVo;
import com.hotel.maintenance.entity.MaintenanceOrder;
import com.hotel.maintenance.service.MaintenanceOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/")
@RequiredArgsConstructor
public class HomeController {

    private final MaintenanceOrderService maintenanceOrderService;

    @GetMapping
    public String index(Model model) {
        model.addAttribute("activeMenu", "home");
        model.addAttribute("dashboardStats", maintenanceOrderService.getDashboardStats());
        List<MaintenanceOrder> allOrders = maintenanceOrderService.findAll();
        List<MaintenanceOrderListVo> recentVos = allOrders.stream()
                .map(MaintenanceOrderListVo::from)
                .collect(Collectors.toList());
        model.addAttribute("recentOrders", recentVos);
        return "index";
    }
}
