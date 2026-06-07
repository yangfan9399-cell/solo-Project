package com.insurance.claim.controller;

import com.insurance.claim.entity.*;
import com.insurance.claim.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.math.BigDecimal;

@Controller
@RequestMapping("/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final ClaimCaseService claimCaseService;
    private final MaterialService materialService;
    private final SysUserService sysUserService;

    @GetMapping("/{caseId}")
    public String reviewForm(@PathVariable Long caseId, Model model) {
        ClaimCase claimCase = claimCaseService.getCaseById(caseId);
        if (claimCase.getFrozen()) {
            model.addAttribute("error", "案件已冻结，无法进行核赔");
        }
        Policy policy = claimCaseService.getPolicyByCaseId(caseId);
        AccidentInfo accidentInfo = claimCaseService.getAccidentInfo(caseId);
        var materials = materialService.getMaterialsByCaseId(caseId);
        var relatedCases = claimCaseService.getRelatedCases(caseId);

        model.addAttribute("claimCase", claimCase);
        model.addAttribute("policy", policy);
        model.addAttribute("accidentInfo", accidentInfo);
        model.addAttribute("materials", materials);
        model.addAttribute("relatedCases", relatedCases);
        return "review/form";
    }

    @PostMapping("/approve")
    public String approve(
            @RequestParam Long caseId,
            @RequestParam String liabilityJudgment,
            @RequestParam BigDecimal approvedAmount,
            @RequestParam(required = false) String remark,
            RedirectAttributes redirectAttributes) {

        try {
            SysUser reviewer = sysUserService.getDefaultReviewer();
            reviewService.approveClaim(caseId, reviewer.getId(), reviewer.getRealName(),
                    liabilityJudgment, approvedAmount, remark);
            redirectAttributes.addFlashAttribute("message", "核赔通过，已赔付");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/cases/" + caseId;
    }

    @PostMapping("/reject")
    public String reject(
            @RequestParam Long caseId,
            @RequestParam String rejectReason,
            @RequestParam(required = false) String liabilityJudgment,
            @RequestParam(required = false) String remark,
            RedirectAttributes redirectAttributes) {

        try {
            SysUser reviewer = sysUserService.getDefaultReviewer();
            reviewService.rejectClaim(caseId, reviewer.getId(), reviewer.getRealName(),
                    rejectReason, liabilityJudgment, remark);
            redirectAttributes.addFlashAttribute("message", "已拒赔");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/cases/" + caseId;
    }

    @PostMapping("/return")
    public String returnCase(
            @RequestParam Long caseId,
            @RequestParam String returnReason,
            @RequestParam(required = false) String remark,
            RedirectAttributes redirectAttributes) {

        try {
            SysUser reviewer = sysUserService.getDefaultReviewer();
            reviewService.returnCase(caseId, reviewer.getId(), reviewer.getRealName(),
                    returnReason, remark);
            redirectAttributes.addFlashAttribute("message", "案件已退回");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/cases/" + caseId;
    }
}
