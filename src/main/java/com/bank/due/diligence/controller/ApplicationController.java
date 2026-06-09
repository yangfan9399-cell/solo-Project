package com.bank.due.diligence.controller;

import com.bank.due.diligence.entity.*;
import com.bank.due.diligence.enums.*;
import com.bank.due.diligence.form.ApplicationForm;
import com.bank.due.diligence.repository.*;
import com.bank.due.diligence.service.AccountApplicationService;
import com.bank.due.diligence.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Map;

@Slf4j
@Controller
@RequestMapping("/")
@RequiredArgsConstructor
public class ApplicationController {

    private final AccountApplicationService applicationService;
    private final StatisticsService statisticsService;
    private final MaterialRepository materialRepository;
    private final RiskTagRepository riskTagRepository;
    private final LegalPersonRepository legalPersonRepository;
    private final BeneficialOwnerRepository beneficialOwnerRepository;
    private final BusinessAddressRepository addressRepository;

    @GetMapping
    public String index(Model model, Authentication authentication) {
        Map<String, Object> dashboard = statisticsService.getDashboardSummary();
        model.addAttribute("dashboard", dashboard);
        model.addAttribute("username", authentication != null ? authentication.getName() : "");
        model.addAttribute("authorities", authentication != null ? authentication.getAuthorities() : null);
        return "index";
    }

    @GetMapping("/applications")
    public String listApplications(@RequestParam(required = false) String status, Model model) {
        List<AccountApplication> applications;
        if (status != null && !status.isEmpty()) {
            applications = applicationService.findByStatus(ApplicationStatus.valueOf(status));
        } else {
            applications = applicationService.findAll();
        }
        model.addAttribute("applications", applications);
        model.addAttribute("selectedStatus", status);
        model.addAttribute("statuses", ApplicationStatus.values());
        return "applications/list";
    }

    @GetMapping("/applications/{id}")
    public String viewApplication(@PathVariable Long id, Model model) {
        AccountApplication application = applicationService.getById(id);
        List<Material> materials = materialRepository.findByApplicationId(id);
        List<RiskTag> riskTags = riskTagRepository.findByApplicationIdOrderByRiskLevelDesc(id);
        List<LegalPerson> legalPersons = legalPersonRepository.findByEnterpriseId(application.getEnterprise().getId());
        List<BeneficialOwner> beneficialOwners = beneficialOwnerRepository.findByEnterpriseId(application.getEnterprise().getId());
        List<BusinessAddress> addresses = addressRepository.findByEnterpriseId(application.getEnterprise().getId());
        List<ApplicationHistory> histories = applicationService.getHistories(id);

        model.addAttribute("application", application);
        model.addAttribute("materials", materials);
        model.addAttribute("riskTags", riskTags);
        model.addAttribute("legalPersons", legalPersons);
        model.addAttribute("beneficialOwners", beneficialOwners);
        model.addAttribute("addresses", addresses);
        model.addAttribute("histories", histories);
        model.addAttribute("materialTypes", MaterialType.values());
        model.addAttribute("materialStatuses", MaterialStatus.values());
        model.addAttribute("riskLevels", RiskLevel.values());

        return "applications/detail";
    }

    @PostMapping("/applications/{id}/submit")
    public String submitApplication(@PathVariable Long id, Authentication authentication,
                                    RedirectAttributes redirectAttributes) {
        try {
            applicationService.submitApplication(id, authentication.getName());
            redirectAttributes.addFlashAttribute("success", "申请提交成功");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "提交失败: " + e.getMessage());
        }
        return "redirect:/applications/" + id;
    }

    @PostMapping("/applications/{id}/operation-pass")
    public String operationPass(@PathVariable Long id,
                                @RequestParam(required = false) String comment,
                                Authentication authentication,
                                RedirectAttributes redirectAttributes) {
        try {
            applicationService.operationVerifyPass(id, authentication.getName(), comment);
            redirectAttributes.addFlashAttribute("success", "材料核验通过");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/applications/" + id;
    }

    @PostMapping("/applications/{id}/operation-fail")
    public String operationFail(@PathVariable Long id,
                                @RequestParam String returnReason,
                                @RequestParam(required = false) String comment,
                                Authentication authentication,
                                RedirectAttributes redirectAttributes) {
        try {
            applicationService.operationVerifyFail(id, authentication.getName(), returnReason, comment);
            redirectAttributes.addFlashAttribute("success", "已退回补正");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/applications/" + id;
    }

    @PostMapping("/applications/{id}/risk-review")
    public String riskReview(@PathVariable Long id,
                             @RequestParam String riskLevel,
                             @RequestParam(required = false) String riskComment,
                             @RequestParam(required = false) String comment,
                             Authentication authentication,
                             RedirectAttributes redirectAttributes) {
        try {
            applicationService.riskReview(id, authentication.getName(), riskLevel, riskComment, comment);
            redirectAttributes.addFlashAttribute("success", "风险复核完成");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/applications/" + id;
    }

    @PostMapping("/applications/{id}/approve")
    public String approve(@PathVariable Long id,
                          @RequestParam(required = false) String comment,
                          Authentication authentication,
                          RedirectAttributes redirectAttributes) {
        try {
            applicationService.approve(id, authentication.getName(), comment);
            redirectAttributes.addFlashAttribute("success", "开户审批通过");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "审批失败: " + e.getMessage());
        }
        return "redirect:/applications/" + id;
    }

    @PostMapping("/applications/{id}/reject")
    public String reject(@PathVariable Long id,
                         @RequestParam String rejectReason,
                         @RequestParam(required = false) String comment,
                         Authentication authentication,
                         RedirectAttributes redirectAttributes) {
        try {
            applicationService.reject(id, authentication.getName(), rejectReason, comment);
            redirectAttributes.addFlashAttribute("success", "已拒绝开户");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/applications/" + id;
    }

    @PostMapping("/applications/{id}/return")
    public String returnToCm(@PathVariable Long id,
                             @RequestParam String returnReason,
                             @RequestParam(required = false) String comment,
                             Authentication authentication,
                             RedirectAttributes redirectAttributes) {
        try {
            applicationService.returnToCustomerManager(id, authentication.getName(), returnReason, comment);
            redirectAttributes.addFlashAttribute("success", "已退回客户经理");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/applications/" + id;
    }

    @PostMapping("/applications/{id}/resubmit")
    public String resubmit(@PathVariable Long id,
                           @RequestParam(required = false) String comment,
                           Authentication authentication,
                           RedirectAttributes redirectAttributes) {
        try {
            applicationService.resubmitAfterSupplement(id, authentication.getName(), comment);
            redirectAttributes.addFlashAttribute("success", "材料补正后已重新提交");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/applications/" + id;
    }

    @PostMapping("/applications/{id}/redue-diligence")
    public String reDueDiligence(@PathVariable Long id,
                                 @RequestParam(required = false) String comment,
                                 Authentication authentication,
                                 RedirectAttributes redirectAttributes) {
        try {
            applicationService.reDueDiligence(id, authentication.getName(), comment);
            redirectAttributes.addFlashAttribute("success", "已发起重新尽调");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "操作失败: " + e.getMessage());
        }
        return "redirect:/applications/" + id;
    }

    @GetMapping("/applications/new")
    public String newApplicationForm(Model model) {
        List<Branch> branches = applicationService.findAllBranches();
        model.addAttribute("branches", branches);
        model.addAttribute("applicationForm", new ApplicationForm());
        return "applications/new";
    }

    @PostMapping("/applications/new")
    public String createNewApplication(@ModelAttribute ApplicationForm applicationForm,
                                        Authentication authentication,
                                        RedirectAttributes redirectAttributes) {
        try {
            Enterprise enterprise = applicationForm.getEnterprise();
            LegalPerson legalPerson = applicationForm.getLegalPerson();
            BeneficialOwner beneficialOwner = applicationForm.getBeneficialOwner();
            BusinessAddress address = applicationForm.getAddress();
            String accountType = applicationForm.getAccountType();
            Long branchId = applicationForm.getBranchId();

            java.util.List<BeneficialOwner> owners = new java.util.ArrayList<>();
            if (beneficialOwner != null && beneficialOwner.getName() != null && !beneficialOwner.getName().isEmpty()) {
                owners.add(beneficialOwner);
            }
            if (legalPerson != null && legalPerson.getName() != null && !legalPerson.getName().isEmpty()) {
                BeneficialOwner boFromLegal = new BeneficialOwner();
                boFromLegal.setName(legalPerson.getName());
                boFromLegal.setIdType(legalPerson.getIdType());
                boFromLegal.setIdNumber(legalPerson.getIdNumber());
                boFromLegal.setPhone(legalPerson.getPhone());
                boFromLegal.setAddress(legalPerson.getAddress());
                boFromLegal.setRelationship("法人");
                if (owners.stream().noneMatch(o -> o.getName().equals(legalPerson.getName()))) {
                    owners.add(0, boFromLegal);
                }
            }

            AccountApplication app = applicationService.createNewApplication(
                    enterprise, legalPerson, owners, address, accountType, branchId, authentication.getName()
            );
            redirectAttributes.addFlashAttribute("success", "开户申请创建成功");
            return "redirect:/applications/" + app.getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "创建失败: " + e.getMessage());
            return "redirect:/applications/new";
        }
    }

    @PostMapping("/materials/{id}/update-status")
    public String updateMaterialStatus(@PathVariable Long id,
                                       @RequestParam MaterialStatus status,
                                       @RequestParam(required = false) String deficiencyReason,
                                       Authentication authentication,
                                       RedirectAttributes redirectAttributes) {
        try {
            Material material = applicationService.updateMaterialStatus(id, status, deficiencyReason, authentication.getName());
            redirectAttributes.addFlashAttribute("success", "材料状态更新成功");
            return "redirect:/applications/" + material.getApplication().getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "更新失败: " + e.getMessage());
            return "redirect:/applications";
        }
    }

    @PostMapping("/addresses/{id}/verify")
    public String verifyAddress(@PathVariable Long id,
                                @RequestParam Boolean isVerified,
                                @RequestParam String verificationResult,
                                @RequestParam Long applicationId,
                                Authentication authentication,
                                RedirectAttributes redirectAttributes) {
        try {
            applicationService.verifyAddress(id, isVerified, verificationResult, authentication.getName());
            redirectAttributes.addFlashAttribute("success", "地址核验结果已更新");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "核验失败: " + e.getMessage());
        }
        return "redirect:/applications/" + applicationId;
    }
}
