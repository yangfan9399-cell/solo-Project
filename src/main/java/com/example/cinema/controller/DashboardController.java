
package com.example.cinema.controller;

import com.example.cinema.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@Controller
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/")
    public String index(Model model) {
        Map<String, Object> dashboardData = dashboardService.getDashboardData();
        List<Map<String, Object>> interruptsByCinema = dashboardService.getInterruptsByCinema();
        List<Map<String, Object>> interruptsByFaultType = dashboardService.getInterruptsByFaultType();
        
        model.addAttribute("dashboardData", dashboardData);
        model.addAttribute("interruptsByCinema", interruptsByCinema);
        model.addAttribute("interruptsByFaultType", interruptsByFaultType);
        
        return "dashboard";
    }

    @GetMapping("/dashboard/halls")
    public String hallsByCinema(@RequestParam("cinemaId") Long cinemaId, Model model) {
        List<Map<String, Object>> interruptsByHall = dashboardService.getInterruptsByHall(cinemaId);
        model.addAttribute("interruptsByHall", interruptsByHall);
        model.addAttribute("cinemaId", cinemaId);
        return "dashboard-halls";
    }
}
