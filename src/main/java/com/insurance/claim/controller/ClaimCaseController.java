package com.insurance.claim.controller;

import com.insurance.claim.entity.*;
import com.insurance.claim.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/cases")
@RequiredArgsConstructor
public class ClaimCaseController {

    private final ClaimCaseService claimCaseService;
    private final PolicyService policyService;
    private final MaterialService materialService;
    private final ReviewService reviewService;
    private final SysUserService sysUserService;

    @GetMapping
    public String list(@RequestParam(required = false) String status, Model model) {
        List<ClaimCase> cases;
        if (status != null && !status.isEmpty()) {
            cases = claimCaseService.getCasesByStatus(status);
        } else {
            cases = claimCaseService.getAllCases();
        }
        model.addAttribute("cases", cases);
        model.addAttribute("selectedStatus", status);
        return "cases/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        ClaimCase claimCase = claimCaseService.getCaseById(id);
        AccidentInfo accidentInfo = claimCaseService.getAccidentInfo(id);
        Policy policy = claimCaseService.getPolicyByCaseId(id);
        List<ClaimMaterial> materials = materialService.getMaterialsByCaseId(id);
        List<ClaimHistory> history = claimCaseService.getHistory(id);
        ClaimReview latestReview = reviewService.getLatestReview(id);
        List<ClaimCase> relatedCases = claimCaseService.getRelatedCases(id);
        List<MaterialType> materialTypes = materialService.getMaterialTypesByInsuranceType(
                policy != null ? policy.getInsuranceType() : null);

        java.util.List<ClaimMaterial> missingMaterials = materials.stream()
                .filter(m -> "MISSING".equals(m.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        java.util.List<ClaimMaterial> submittedMaterials = materials.stream()
                .filter(m -> "SUBMITTED".equals(m.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        java.util.List<ClaimMaterial> approvedMaterials = materials.stream()
                .filter(m -> "APPROVED".equals(m.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        java.util.List<ClaimMaterial> rejectedMaterials = materials.stream()
                .filter(m -> "REJECTED".equals(m.getStatus()))
                .collect(java.util.stream.Collectors.toList());

        model.addAttribute("claimCase", claimCase);
        model.addAttribute("accidentInfo", accidentInfo);
        model.addAttribute("policy", policy);
        model.addAttribute("materials", materials);
        model.addAttribute("missingMaterials", missingMaterials);
        model.addAttribute("submittedMaterials", submittedMaterials);
        model.addAttribute("approvedMaterials", approvedMaterials);
        model.addAttribute("rejectedMaterials", rejectedMaterials);
        model.addAttribute("history", history);
        model.addAttribute("latestReview", latestReview);
        model.addAttribute("relatedCases", relatedCases);
        model.addAttribute("materialTypes", materialTypes);
        return "cases/detail";
    }

    @GetMapping("/register")
    public String registerForm(Model model) {
        model.addAttribute("policies", policyService.getAllPolicies());
        model.addAttribute("accidentTypes", List.of("意外事故", "疾病医疗", "财产损失", "车险事故"));
        return "cases/register";
    }

    @PostMapping("/register")
    public String register(
            @RequestParam Long policyId,
            @RequestParam String reporterName,
            @RequestParam String reporterPhone,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate accidentDate,
            @RequestParam String accidentType,
            @RequestParam String accidentDescription,
            @RequestParam BigDecimal claimAmount,
            @RequestParam(required = false) String accidentLocation,
            @RequestParam(required = false) String injuryDescription,
            @RequestParam(required = false) String diagnosisResult,
            @RequestParam(required = false) String hospitalName,
            @RequestParam(required = false) BigDecimal treatmentCost,
            @RequestParam(required = false) BigDecimal propertyLoss,
            RedirectAttributes redirectAttributes) {

        ClaimCase claimCase = new ClaimCase();
        claimCase.setPolicyId(policyId);
        claimCase.setReporterName(reporterName);
        claimCase.setReporterPhone(reporterPhone);
        claimCase.setAccidentDate(accidentDate);
        claimCase.setAccidentType(accidentType);
        claimCase.setAccidentDescription(accidentDescription);
        claimCase.setClaimAmount(claimAmount);

        AccidentInfo accidentInfo = new AccidentInfo();
        accidentInfo.setAccidentLocation(accidentLocation);
        accidentInfo.setInjuryDescription(injuryDescription);
        accidentInfo.setDiagnosisResult(diagnosisResult);
        accidentInfo.setHospitalName(hospitalName);
        accidentInfo.setTreatmentCost(treatmentCost);
        accidentInfo.setPropertyLoss(propertyLoss);

        SysUser handler = sysUserService.getDefaultHandler();
        ClaimCase saved = claimCaseService.registerCase(claimCase, accidentInfo, handler.getId());

        redirectAttributes.addFlashAttribute("message", "案件登记成功，案件号：" + saved.getCaseNo());
        if (saved.getFrozen()) {
            redirectAttributes.addFlashAttribute("warning", "检测到疑似重复报案，案件已冻结，请核实");
        }
        return "redirect:/cases/" + saved.getId();
    }

    @PostMapping("/{id}/submit-review")
    public String submitToReview(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            SysUser handler = sysUserService.getDefaultHandler();
            claimCaseService.submitToReview(id, handler.getId(), handler.getRealName());
            redirectAttributes.addFlashAttribute("message", "案件已提交核赔");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/cases/" + id;
    }

    @PostMapping("/{id}/unfreeze")
    public String unfreeze(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        SysUser handler = sysUserService.getDefaultHandler();
        claimCaseService.unfreezeCase(id, handler.getId(), handler.getRealName());
        redirectAttributes.addFlashAttribute("message", "案件已解除冻结");
        return "redirect:/cases/" + id;
    }
}
