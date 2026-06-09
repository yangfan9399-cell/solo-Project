package com.fire.inspection.controller;

import com.fire.inspection.entity.FireHazard;
import com.fire.inspection.entity.HazardHistory;
import com.fire.inspection.entity.Rectification;
import com.fire.inspection.entity.User;
import com.fire.inspection.enums.HazardCategory;
import com.fire.inspection.enums.HazardLevel;
import com.fire.inspection.enums.HazardStatus;
import com.fire.inspection.enums.UserRole;
import com.fire.inspection.service.FireHazardService;
import com.fire.inspection.service.StatisticsService;
import com.fire.inspection.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequestMapping("/hazards")
@RequiredArgsConstructor
public class FireHazardController {

    private final FireHazardService fireHazardService;
    private final UserService userService;
    private final StatisticsService statisticsService;

    @GetMapping
    public String list(@RequestParam(required = false) HazardStatus status,
                       @RequestParam(required = false) String keyword,
                       Model model) {
        List<FireHazard> hazards;
        if (status != null) {
            hazards = fireHazardService.findByStatus(status);
        } else {
            hazards = fireHazardService.findAll();
        }

        if (keyword != null && !keyword.isEmpty()) {
            hazards = hazards.stream()
                    .filter(h -> h.getTitle().contains(keyword)
                            || (h.getLocation() != null && h.getLocation().contains(keyword))
                            || (h.getBuilding() != null && h.getBuilding().contains(keyword)))
                    .toList();
        }

        model.addAttribute("hazards", hazards);
        model.addAttribute("currentStatus", status);
        model.addAttribute("keyword", keyword);
        model.addAttribute("statuses", HazardStatus.values());

        long totalCount = hazards.size();
        long acceptedCount = hazards.stream().filter(h -> h.getStatus() == HazardStatus.ACCEPTED).count();
        long overdueCount = hazards.stream().filter(h -> h.getStatus() == HazardStatus.OVERDUE || h.getOverdue()).count();
        long pendingCount = totalCount - acceptedCount;

        model.addAttribute("totalCount", totalCount);
        model.addAttribute("acceptedCount", acceptedCount);
        model.addAttribute("overdueCount", overdueCount);
        model.addAttribute("pendingCount", pendingCount);

        return "hazard/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        FireHazard hazard = fireHazardService.findById(id);
        if (hazard == null) {
            return "redirect:/hazards";
        }

        List<HazardHistory> history = fireHazardService.getHistory(id);
        List<Rectification> rectifications = fireHazardService.getRectifications(id);
        long remainingDays = fireHazardService.getRemainingDays(hazard);
        boolean isOverdue = fireHazardService.isOverdue(hazard);

        model.addAttribute("hazard", hazard);
        model.addAttribute("history", history);
        model.addAttribute("rectifications", rectifications);
        model.addAttribute("remainingDays", remainingDays);
        model.addAttribute("isOverdue", isOverdue);
        model.addAttribute("directors", userService.findByRole(UserRole.SAFETY_DIRECTOR));

        return "hazard/detail";
    }

    @GetMapping("/register")
    public String registerForm(Model model) {
        model.addAttribute("hazard", new FireHazard());
        model.addAttribute("levels", HazardLevel.values());
        model.addAttribute("categories", HazardCategory.values());
        model.addAttribute("inspectors", userService.findByRole(UserRole.INSPECTOR));
        return "hazard/register";
    }

    @PostMapping("/register")
    public String registerSubmit(@ModelAttribute FireHazard hazard,
                                 @RequestParam Long inspectorId,
                                 RedirectAttributes redirectAttributes) {
        FireHazard saved = fireHazardService.registerHazard(hazard, inspectorId);
        redirectAttributes.addFlashAttribute("message", "隐患登记成功！");
        return "redirect:/hazards/" + saved.getId();
    }

    @GetMapping("/{id}/assign")
    public String assignForm(@PathVariable Long id, Model model) {
        FireHazard hazard = fireHazardService.findById(id);
        if (hazard == null) {
            return "redirect:/hazards";
        }
        model.addAttribute("hazard", hazard);
        model.addAttribute("departmentHeads", userService.findByRole(UserRole.DEPARTMENT_HEAD));
        return "hazard/assign";
    }

    @PostMapping("/{id}/assign")
    public String assignSubmit(@PathVariable Long id,
                               @RequestParam Long departmentHeadId,
                               @RequestParam String department,
                               @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm") LocalDateTime deadline,
                               RedirectAttributes redirectAttributes) {
        fireHazardService.assignDepartment(id, departmentHeadId, department, deadline);
        redirectAttributes.addFlashAttribute("message", "已分配责任部门！");
        return "redirect:/hazards/" + id;
    }

    @GetMapping("/{id}/rectify")
    public String rectifyForm(@PathVariable Long id, Model model) {
        FireHazard hazard = fireHazardService.findById(id);
        if (hazard == null) {
            return "redirect:/hazards";
        }
        model.addAttribute("hazard", hazard);
        model.addAttribute("rectifiers", userService.findByRole(UserRole.DEPARTMENT_HEAD));
        return "hazard/rectify";
    }

    @PostMapping("/{id}/rectify")
    public String rectifySubmit(@PathVariable Long id,
                                @RequestParam String description,
                                @RequestParam(required = false) String photoUrl,
                                @RequestParam Long rectifierId,
                                RedirectAttributes redirectAttributes) {
        fireHazardService.submitRectification(id, description, photoUrl, rectifierId);
        redirectAttributes.addFlashAttribute("message", "整改提交成功，等待验收！");
        return "redirect:/hazards/" + id;
    }

    @GetMapping("/{id}/accept")
    public String acceptForm(@PathVariable Long id, Model model) {
        FireHazard hazard = fireHazardService.findById(id);
        if (hazard == null) {
            return "redirect:/hazards";
        }
        model.addAttribute("hazard", hazard);
        model.addAttribute("directors", userService.findByRole(UserRole.SAFETY_DIRECTOR));
        return "hazard/accept";
    }

    @PostMapping("/{id}/accept")
    public String acceptSubmit(@PathVariable Long id,
                               @RequestParam Long directorId,
                               @RequestParam(required = false) String remark,
                               RedirectAttributes redirectAttributes) {
        fireHazardService.acceptHazard(id, directorId, remark);
        redirectAttributes.addFlashAttribute("message", "验收通过，隐患已销项！");
        return "redirect:/hazards/" + id;
    }

    @PostMapping("/{id}/reject")
    public String rejectSubmit(@PathVariable Long id,
                               @RequestParam Long directorId,
                               @RequestParam String rejectReason,
                               RedirectAttributes redirectAttributes) {
        fireHazardService.rejectHazard(id, directorId, rejectReason);
        redirectAttributes.addFlashAttribute("message", "已退回整改，原因：" + rejectReason);
        return "redirect:/hazards/" + id;
    }

    @PostMapping("/{id}/escalate")
    public String escalate(@PathVariable Long id,
                           @RequestParam Long operatorId,
                           RedirectAttributes redirectAttributes) {
        fireHazardService.escalateHazard(id, operatorId);
        redirectAttributes.addFlashAttribute("message", "已升级超期隐患！");
        return "redirect:/hazards/" + id;
    }

    @GetMapping("/statistics")
    public String statistics(Model model) {
        model.addAttribute("statusStats", statisticsService.getStatusStatistics());
        model.addAttribute("buildingStats", statisticsService.getBuildingStatistics());
        model.addAttribute("categoryStats", statisticsService.getCategoryStatistics());
        model.addAttribute("departmentStats", statisticsService.getDepartmentStatistics());
        model.addAttribute("levelStats", statisticsService.getLevelStatistics());
        model.addAttribute("rectificationTimeStats", statisticsService.getRectificationTimeStatistics());
        model.addAttribute("totalCount", statisticsService.getTotalCount());
        model.addAttribute("acceptedCount", statisticsService.getAcceptedCount());
        model.addAttribute("overdueCount", statisticsService.getOverdueCount());

        return "hazard/statistics";
    }
}
