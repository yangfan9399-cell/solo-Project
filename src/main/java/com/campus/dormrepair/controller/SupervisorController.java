package com.campus.dormrepair.controller;

import com.campus.dormrepair.dto.BuildingStats;
import com.campus.dormrepair.dto.FaultTypeStats;
import com.campus.dormrepair.dto.RepairDurationStats;
import com.campus.dormrepair.dto.TimeoutStats;
import com.campus.dormrepair.entity.Repair;
import com.campus.dormrepair.entity.User;
import com.campus.dormrepair.enums.RepairStatus;
import com.campus.dormrepair.enums.SatisfactionLevel;
import com.campus.dormrepair.enums.TimeoutReason;
import com.campus.dormrepair.service.RepairService;
import com.campus.dormrepair.service.StatsService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/supervisor")
public class SupervisorController {

    @Autowired
    private RepairService repairService;

    @Autowired
    private StatsService statsService;

    @GetMapping("/repairs")
    public String repairList(@RequestParam(required = false) RepairStatus status,
                             Model model, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        List<Repair> repairs;
        if (status != null) {
            repairs = repairService.findByStatus(status);
        } else {
            repairs = repairService.findAll();
        }

        model.addAttribute("repairs", repairs);
        model.addAttribute("statuses", RepairStatus.values());
        model.addAttribute("selectedStatus", status);
        model.addAttribute("satisfactionLevels", SatisfactionLevel.values());
        model.addAttribute("timeoutReasons", TimeoutReason.values());
        model.addAttribute("currentUser", user);
        return "supervisor/repairs";
    }

    @PostMapping("/timeout/{id}")
    public String markTimeout(@PathVariable Long id,
                              @RequestParam TimeoutReason reason,
                              @RequestParam String detail,
                              HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        try {
            repairService.markTimeout(id, reason, detail, user);
        } catch (IllegalStateException e) {
            return "redirect:/supervisor/repairs?error=" + e.getMessage();
        }
        return "redirect:/supervisor/repairs";
    }

    @PostMapping("/review/{id}")
    public String reviewRepair(@PathVariable Long id,
                               @RequestParam SatisfactionLevel satisfaction,
                               @RequestParam(required = false) String reviewComment,
                               HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        try {
            repairService.reviewRepair(id, user, satisfaction,
                    reviewComment != null ? reviewComment : "");
        } catch (IllegalStateException e) {
            return "redirect:/supervisor/repairs?error=" + e.getMessage();
        }
        return "redirect:/supervisor/repairs";
    }

    @PostMapping("/close/{id}")
    public String closeRepair(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        try {
            repairService.closeRepair(id, user);
        } catch (IllegalStateException e) {
            return "redirect:/supervisor/repairs?error=" + e.getMessage();
        }
        return "redirect:/supervisor/repairs";
    }

    @PostMapping("/reopen/{id}")
    public String reopenRepair(@PathVariable Long id,
                               @RequestParam String reason,
                               HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        try {
            repairService.reopenRepair(id, user, reason);
        } catch (IllegalStateException e) {
            return "redirect:/supervisor/repairs?error=" + e.getMessage();
        }
        return "redirect:/supervisor/repairs";
    }

    @GetMapping("/repair/{id}")
    public String repairDetail(@PathVariable Long id, Model model, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        Repair repair = repairService.findById(id).orElse(null);
        if (repair == null) return "redirect:/supervisor/repairs";

        model.addAttribute("repair", repair);
        model.addAttribute("histories", repairService.findHistoriesByRepairId(id));
        model.addAttribute("parts", repairService.findPartsByRepairId(id));
        model.addAttribute("satisfactionLevels", SatisfactionLevel.values());
        model.addAttribute("timeoutReasons", TimeoutReason.values());
        model.addAttribute("canClose", repairService.canClose(repair));
        model.addAttribute("isDissatisfied", repairService.isDissatisfied(repair));
        model.addAttribute("currentUser", user);
        return "repair/detail";
    }

    @GetMapping("/stats")
    public String stats(Model model, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        List<BuildingStats> buildingStats = statsService.getBuildingStats();
        List<FaultTypeStats> faultTypeStats = statsService.getFaultTypeStats();
        List<TimeoutStats> timeoutStats = statsService.getTimeoutStats();
        List<RepairDurationStats> durationStats = statsService.getRepairDurationStats();

        model.addAttribute("buildingStats", buildingStats);
        model.addAttribute("faultTypeStats", faultTypeStats);
        model.addAttribute("timeoutStats", timeoutStats);
        model.addAttribute("durationStats", durationStats);
        model.addAttribute("currentUser", user);
        return "supervisor/stats";
    }
}
