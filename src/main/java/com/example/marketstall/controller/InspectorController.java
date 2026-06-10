package com.example.marketstall.controller;

import com.example.marketstall.dto.StallDetailDTO;
import com.example.marketstall.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/inspector")
@RequiredArgsConstructor
public class InspectorController {

    private final ViolationRecordService violationRecordService;
    private final StallService stallService;
    private final HistoryNodeService historyNodeService;

    @GetMapping("/violations")
    public String listViolations(Model model) {
        model.addAttribute("violations", violationRecordService.getAllViolationRecords());
        return "inspector/violations";
    }

    @GetMapping("/stalls")
    public String listStalls(Model model) {
        model.addAttribute("stalls", stallService.getAllStalls());
        return "inspector/stalls";
    }

    @GetMapping("/stalls/{id}")
    public String stallDetail(@PathVariable Long id, Model model) {
        StallDetailDTO detail = stallService.getStallDetail(id);
        model.addAttribute("detail", detail);
        return "inspector/stall-detail";
    }

    @GetMapping("/stalls/{id}/violation")
    public String recordViolation(@PathVariable Long id, Model model) {
        model.addAttribute("stallId", id);
        model.addAttribute("stall", stallService.getStallById(id));
        return "inspector/violation-form";
    }

    @PostMapping("/stalls/{id}/violation")
    public String processViolation(@PathVariable Long id, 
                                   @RequestParam String violationType,
                                   @RequestParam String description,
                                   @RequestParam int pointsDeducted) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String inspector = auth.getName();
        
        violationRecordService.recordViolation(id, violationType, description, pointsDeducted, inspector);
        
        historyNodeService.addNode(id, "VIOLATION", "记录违规: " + violationType + "，扣分: " + pointsDeducted, inspector);
        
        return "redirect:/inspector/stalls/" + id;
    }
}