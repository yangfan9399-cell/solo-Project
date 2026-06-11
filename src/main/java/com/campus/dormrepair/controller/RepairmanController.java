package com.campus.dormrepair.controller;

import com.campus.dormrepair.entity.Repair;
import com.campus.dormrepair.entity.User;
import com.campus.dormrepair.enums.RepairStatus;
import com.campus.dormrepair.enums.TimeoutReason;
import com.campus.dormrepair.service.RepairService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/repairman")
public class RepairmanController {

    @Autowired
    private RepairService repairService;

    @GetMapping("/repairs")
    public String myRepairs(@RequestParam(required = false) RepairStatus status,
                            Model model, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        List<Repair> repairs;
        if (status != null) {
            repairs = repairService.findByStatus(status);
        } else {
            repairs = repairService.findByRepairmanId(user.getId());
        }

        model.addAttribute("repairs", repairs);
        model.addAttribute("statuses", RepairStatus.values());
        model.addAttribute("selectedStatus", status);
        model.addAttribute("currentUser", user);
        return "repairman/repairs";
    }

    @PostMapping("/start/{id}")
    public String startRepair(@PathVariable Long id, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        try {
            repairService.startRepair(id, user);
        } catch (IllegalStateException e) {
            return "redirect:/repairman/repairs?error=" + e.getMessage();
        }
        return "redirect:/repairman/repairs";
    }

    @PostMapping("/parts-shortage/{id}")
    public String partsShortage(@PathVariable Long id,
                                @RequestParam String remark,
                                HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        try {
            repairService.markPartsShortage(id, user, remark);
        } catch (IllegalStateException e) {
            return "redirect:/repairman/repairs?error=" + e.getMessage();
        }
        return "redirect:/repairman/repairs";
    }

    @PostMapping("/complete/{id}")
    public String completeRepair(@PathVariable Long id,
                                 @RequestParam String repairNote,
                                 @RequestParam(required = false) String partsUsed,
                                 HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        try {
            repairService.completeRepair(id, user, repairNote, partsUsed, null);
        } catch (IllegalStateException e) {
            return "redirect:/repairman/repairs?error=" + e.getMessage();
        }
        return "redirect:/repairman/repairs";
    }

    @GetMapping("/repair/{id}")
    public String repairDetail(@PathVariable Long id, Model model, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        Repair repair = repairService.findById(id).orElse(null);
        if (repair == null) return "redirect:/repairman/repairs";

        model.addAttribute("repair", repair);
        model.addAttribute("histories", repairService.findHistoriesByRepairId(id));
        model.addAttribute("parts", repairService.findPartsByRepairId(id));
        model.addAttribute("timeoutReasons", TimeoutReason.values());
        model.addAttribute("currentUser", user);
        return "repair/detail";
    }
}
