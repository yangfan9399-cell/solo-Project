package com.campus.dormrepair.controller;

import com.campus.dormrepair.entity.Repair;
import com.campus.dormrepair.entity.User;
import com.campus.dormrepair.enums.RepairStatus;
import com.campus.dormrepair.enums.UserRole;
import com.campus.dormrepair.service.RepairService;
import com.campus.dormrepair.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/dorm-manager")
public class DormManagerController {

    @Autowired
    private RepairService repairService;

    @Autowired
    private UserService userService;

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

        List<User> repairmen = userService.findByRole(UserRole.REPAIRMAN);

        model.addAttribute("repairs", repairs);
        model.addAttribute("repairmen", repairmen);
        model.addAttribute("statuses", RepairStatus.values());
        model.addAttribute("selectedStatus", status);
        model.addAttribute("currentUser", user);
        return "dorm-manager/repairs";
    }

    @PostMapping("/assign/{id}")
    public String assignRepair(@PathVariable Long id,
                               @RequestParam Long repairmanId,
                               HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        User repairman = userService.findById(repairmanId).orElse(null);
        if (repairman != null) {
            try {
                repairService.assignRepair(id, repairman, user);
            } catch (IllegalStateException e) {
                return "redirect:/dorm-manager/repairs?error=" + e.getMessage();
            }
        }
        return "redirect:/dorm-manager/repairs";
    }

    @GetMapping("/repair/{id}")
    public String repairDetail(@PathVariable Long id, Model model, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        Repair repair = repairService.findById(id).orElse(null);
        if (repair == null) return "redirect:/dorm-manager/repairs";

        List<User> repairmen = userService.findByRole(UserRole.REPAIRMAN);

        model.addAttribute("repair", repair);
        model.addAttribute("histories", repairService.findHistoriesByRepairId(id));
        model.addAttribute("parts", repairService.findPartsByRepairId(id));
        model.addAttribute("repairmen", repairmen);
        model.addAttribute("currentUser", user);
        return "repair/detail";
    }
}
