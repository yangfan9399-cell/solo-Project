package com.example.coldchain.controller;

import com.example.coldchain.entity.Compensation;
import com.example.coldchain.entity.Waybill;
import com.example.coldchain.service.CompensationService;
import com.example.coldchain.service.WaybillService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.math.BigDecimal;
import java.util.List;

@Controller
@RequestMapping("/compensation")
@RequiredArgsConstructor
public class CompensationController {

    private final CompensationService compensationService;
    private final WaybillService waybillService;

    @GetMapping("/pending")
    public String pendingAssessments(Model model) {
        List<Compensation> compensations = compensationService.findPendingAssessments();
        model.addAttribute("compensations", compensations);
        return "compensation/pending-assessment";
    }

    @GetMapping("/review")
    public String pendingReviews(Model model) {
        List<Compensation> compensations = compensationService.findPendingReviews();
        model.addAttribute("compensations", compensations);
        return "compensation/pending-review";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        Compensation compensation = compensationService.findByWaybillId(id)
                .orElseThrow(() -> new RuntimeException("赔付记录不存在"));
        Waybill waybill = waybillService.findById(id).orElse(null);
        model.addAttribute("compensation", compensation);
        model.addAttribute("waybill", waybill);
        return "compensation/detail";
    }

    @PostMapping("/{id}/assess")
    public String assess(@PathVariable Long id,
                         @RequestParam BigDecimal assessedAmount,
                         @RequestParam String comment,
                         RedirectAttributes redirectAttributes) {
        compensationService.assess(id, 2L, "质控李四", assessedAmount, comment);
        redirectAttributes.addFlashAttribute("success", "评估完成");
        return "redirect:/compensation/review";
    }

    @PostMapping("/{id}/approve")
    public String approve(@PathVariable Long id,
                          @RequestParam String comment,
                          RedirectAttributes redirectAttributes) {
        compensationService.approve(id, 3L, "理赔王五", comment);
        redirectAttributes.addFlashAttribute("success", "赔付已通过");
        return "redirect:/compensation/review";
    }

    @PostMapping("/{id}/reject")
    public String reject(@PathVariable Long id,
                         @RequestParam String comment,
                         RedirectAttributes redirectAttributes) {
        compensationService.reject(id, 3L, "理赔王五", comment);
        redirectAttributes.addFlashAttribute("success", "赔付已拒绝");
        return "redirect:/compensation/review";
    }
}