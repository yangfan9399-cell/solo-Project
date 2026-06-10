package com.example.marketstall.controller;

import com.example.marketstall.dto.StallDetailDTO;
import com.example.marketstall.entity.Stall;
import com.example.marketstall.entity.ViolationRecord;
import com.example.marketstall.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/supervisor")
@RequiredArgsConstructor
public class SupervisorController {

    private final ViolationRecordService violationRecordService;
    private final StallService stallService;
    private final HistoryNodeService historyNodeService;

    @GetMapping("/violations")
    public String listViolations(Model model) {
        model.addAttribute("violations", violationRecordService.getAllViolationRecords());
        return "supervisor/violations";
    }

    @GetMapping("/violations/pending")
    public String listPendingViolations(Model model) {
        model.addAttribute("violations", violationRecordService.getPendingViolations());
        return "supervisor/violations-pending";
    }

    @GetMapping("/violations/{id}/review")
    public String reviewViolation(@PathVariable Long id, Model model) {
        ViolationRecord violation = violationRecordService.getViolationRecordById(id);
        model.addAttribute("violation", violation);
        return "supervisor/violation-review";
    }

    @PostMapping("/violations/{id}/review")
    public String processReview(@PathVariable Long id, 
                                @RequestParam String status,
                                @RequestParam(required = false) String remark) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String supervisor = auth.getName();
        
        violationRecordService.reviewViolation(id, status, remark);
        
        ViolationRecord violation = violationRecordService.getViolationRecordById(id);
        historyNodeService.addNode(violation.getStallId(), "REVIEW", "违规复核: " + status + "，备注: " + remark, supervisor);
        
        return "redirect:/supervisor/violations/pending";
    }

    @GetMapping("/stalls")
    public String listStalls(Model model) {
        model.addAttribute("stalls", stallService.getAllStalls());
        return "supervisor/stalls";
    }

    @GetMapping("/stalls/{id}")
    public String stallDetail(@PathVariable Long id, Model model) {
        StallDetailDTO detail = stallService.getStallDetail(id);
        model.addAttribute("detail", detail);
        return "supervisor/stall-detail";
    }

    @GetMapping("/stalls/{id}/suspend")
    public String suspendLease(@PathVariable Long id, Model model) {
        Stall stall = stallService.getStallById(id);
        model.addAttribute("stall", stall);
        return "supervisor/suspend-form";
    }

    @PostMapping("/stalls/{id}/suspend")
    public String processSuspend(@PathVariable Long id, @RequestParam String remark) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String supervisor = auth.getName();
        
        violationRecordService.suspendLease(id, remark);
        
        Stall stall = stallService.getStallById(id);
        stall.setStatus("suspended");
        stallService.saveStall(stall);
        
        historyNodeService.addNode(id, "SUSPEND", "停租处理，原因: " + remark, supervisor);
        
        return "redirect:/supervisor/stalls/" + id;
    }
}