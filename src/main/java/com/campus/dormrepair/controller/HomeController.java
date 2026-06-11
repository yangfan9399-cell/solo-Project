package com.campus.dormrepair.controller;

import com.campus.dormrepair.entity.User;
import com.campus.dormrepair.enums.UserRole;
import com.campus.dormrepair.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
public class HomeController {

    @Autowired
    private UserService userService;

    @GetMapping("/")
    public String index(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return "redirect:/login";
        }
        return "redirect:/dashboard";
    }

    @GetMapping("/login")
    public String loginPage(Model model) {
        List<User> students = userService.findByRole(UserRole.STUDENT);
        List<User> dormManagers = userService.findByRole(UserRole.DORM_MANAGER);
        List<User> repairmen = userService.findByRole(UserRole.REPAIRMAN);
        List<User> supervisors = userService.findByRole(UserRole.LOGISTICS_SUPERVISOR);

        model.addAttribute("students", students);
        model.addAttribute("dormManagers", dormManagers);
        model.addAttribute("repairmen", repairmen);
        model.addAttribute("supervisors", supervisors);
        return "login";
    }

    @PostMapping("/login")
    public String login(@RequestParam Long userId, HttpSession session) {
        User user = userService.findById(userId).orElse(null);
        if (user != null) {
            session.setAttribute("currentUser", user);
        }
        return "redirect:/dashboard";
    }

    @GetMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }

    @GetMapping("/dashboard")
    public String dashboard(HttpSession session) {
        User user = (User) session.getAttribute("currentUser");
        if (user == null) {
            return "redirect:/login";
        }
        switch (user.getRole()) {
            case STUDENT:
                return "redirect:/student/repairs";
            case DORM_MANAGER:
                return "redirect:/dorm-manager/repairs";
            case REPAIRMAN:
                return "redirect:/repairman/repairs";
            case LOGISTICS_SUPERVISOR:
                return "redirect:/supervisor/repairs";
            default:
                return "redirect:/login";
        }
    }
}
