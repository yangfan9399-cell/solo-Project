package com.hotel.maintenance.controller;

import com.hotel.maintenance.dto.StatisticsDto;
import com.hotel.maintenance.service.MaintenanceOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final MaintenanceOrderService maintenanceOrderService;

    @GetMapping
    public String index(Model model) {
        List<StatisticsDto> byFloor = maintenanceOrderService.getStatisticsByFloor();
        List<StatisticsDto> byRoomType = maintenanceOrderService.getStatisticsByRoomType();
        List<StatisticsDto> byFaultType = maintenanceOrderService.getStatisticsByFaultType();
        List<StatisticsDto> byDuration = maintenanceOrderService.getStatisticsByOutageDuration();

        model.addAttribute("activeMenu", "statistics");
        model.addAttribute("byFloor", byFloor);
        model.addAttribute("byRoomType", byRoomType);
        model.addAttribute("byFaultType", byFaultType);
        model.addAttribute("byDuration", byDuration);
        model.addAttribute("dashboardStats", maintenanceOrderService.getDashboardStats());
        return "statistics/index";
    }
}
