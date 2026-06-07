package com.insurance.claim.controller;

import com.insurance.claim.entity.*;
import com.insurance.claim.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/materials")
@RequiredArgsConstructor
public class MaterialController {

    private final MaterialService materialService;
    private final ClaimCaseService claimCaseService;
    private final SysUserService sysUserService;

    @GetMapping("/upload/{caseId}")
    public String uploadForm(@PathVariable Long caseId, Model model) {
        ClaimCase claimCase = claimCaseService.getCaseById(caseId);
        Policy policy = claimCaseService.getPolicyByCaseId(caseId);
        var materialTypes = materialService.getMaterialTypesByInsuranceType(
                policy != null ? policy.getInsuranceType() : null);

        model.addAttribute("claimCase", claimCase);
        model.addAttribute("materialTypes", materialTypes);
        return "materials/upload";
    }

    @PostMapping("/upload")
    public String upload(
            @RequestParam Long caseId,
            @RequestParam Long materialTypeId,
            @RequestParam(required = false) String materialName,
            @RequestParam(required = false) String fileName,
            RedirectAttributes redirectAttributes) {

        SysUser uploader = sysUserService.getDefaultCustomer();
        materialService.uploadMaterial(caseId, materialTypeId, materialName, fileName,
                "/files/" + caseId + "/" + fileName, uploader.getId());

        redirectAttributes.addFlashAttribute("message", "材料上传成功");
        return "redirect:/cases/" + caseId;
    }

    @PostMapping("/request-supplement")
    public String requestSupplement(
            @RequestParam Long caseId,
            @RequestParam String missingMaterials,
            RedirectAttributes redirectAttributes) {

        SysUser reviewer = sysUserService.getDefaultReviewer();
        materialService.requestMaterialSupplement(caseId, missingMaterials,
                reviewer.getId(), reviewer.getRealName());

        redirectAttributes.addFlashAttribute("message", "已发送材料补正通知");
        return "redirect:/cases/" + caseId;
    }
}
