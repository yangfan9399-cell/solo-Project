package com.campus.dormrepair.controller;

import com.campus.dormrepair.entity.Repair;
import com.campus.dormrepair.entity.User;
import com.campus.dormrepair.enums.FaultType;
import com.campus.dormrepair.service.RepairService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/student")
public class StudentController {

    @Autowired
    private RepairService repairService;

    @GetMapping("/repairs")
    public String myRepairs(Model model, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        List<Repair> repairs = repairService.findByStudentId(user.getId());
        model.addAttribute("repairs", repairs);
        model.addAttribute("currentUser", user);
        return "student/repairs";
    }

    @GetMapping("/submit")
    public String submitForm(Model model, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        model.addAttribute("faultTypes", FaultType.values());
        model.addAttribute("currentUser", user);
        return "student/submit";
    }

    @PostMapping("/submit")
    public String submitRepair(@RequestParam String building,
                               @RequestParam String roomNo,
                               @RequestParam FaultType faultType,
                               @RequestParam String description,
                               HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        repairService.submitRepair(building, roomNo, faultType, description,
                user, user.getRealName(), user.getPhone());
        return "redirect:/student/repairs";
    }

    @GetMapping("/repair/{id}")
    public String repairDetail(@PathVariable Long id, Model model, HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) return "redirect:/login";

        Repair repair = repairService.findById(id).orElse(null);
        if (repair == null) return "redirect:/student/repairs";

        model.addAttribute("repair", repair);
        model.addAttribute("histories", repairService.findHistoriesByRepairId(id));
        model.addAttribute("parts", repairService.findPartsByRepairId(id));
        model.addAttribute("currentUser", user);
        model.addAttribute("canClose", repairService.canClose(repair));
        model.addAttribute("isDissatisfied", repairService.isDissatisfied(repair));
        return "repair/detail";
    }
}
