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
        var allMaterialTypes = materialService.getMaterialTypesByInsuranceType(
                policy != null ? policy.getInsuranceType() : null);
        var missingMaterials = materialService.getMissingMaterials(caseId);
        var allMaterials = materialService.getMaterialsByCaseId(caseId);

        java.util.Set<Long> excludedTypeIds = allMaterials.stream()
                .filter(m -> "SUBMITTED".equals(m.getStatus()) || "APPROVED".equals(m.getStatus()))
                .map(ClaimMaterial::getMaterialTypeId)
                .collect(java.util.stream.Collectors.toSet());
        var availableTypes = allMaterialTypes.stream()
                .filter(mt -> !excludedTypeIds.contains(mt.getId()))
                .collect(java.util.stream.Collectors.toList());

        model.addAttribute("claimCase", claimCase);
        model.addAttribute("materialTypes", availableTypes);
        model.addAttribute("missingMaterials", missingMaterials);
        model.addAttribute("allMaterials", allMaterials);
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
        try {
            materialService.uploadMaterial(caseId, materialTypeId, materialName, fileName,
                    "/files/" + caseId + "/" + fileName, uploader.getId());
            redirectAttributes.addFlashAttribute("message", "材料上传成功");
        } catch (IllegalStateException e) {
            redirectAttributes.addFlashAttribute("warning", e.getMessage());
        }
        return "redirect:/cases/" + caseId;
    }

    @PostMapping("/request-supplement")
    public String requestSupplement(
            @RequestParam Long caseId,
            @RequestParam(required = false) List<Long> materialTypeIds,
            @RequestParam(required = false) String remark,
            RedirectAttributes redirectAttributes) {

        if (materialTypeIds == null || materialTypeIds.isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "请至少选择一项缺失材料");
            return "redirect:/cases/" + caseId;
        }

        SysUser reviewer = sysUserService.getDefaultReviewer();
        int addedCount = materialService.requestMaterialSupplement(caseId, materialTypeIds, remark,
                reviewer.getId(), reviewer.getRealName());

        if (addedCount == 0) {
            redirectAttributes.addFlashAttribute("warning", "所选材料均已存在或已提交，未新增待补传项");
        } else {
            redirectAttributes.addFlashAttribute("message", "已发送材料补正通知，共 " + addedCount + " 项材料待补传");
        }
        return "redirect:/cases/" + caseId;
    }
}
