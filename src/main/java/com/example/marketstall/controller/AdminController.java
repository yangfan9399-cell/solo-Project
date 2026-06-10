package com.example.marketstall.controller;

import com.example.marketstall.dto.StallDetailDTO;
import com.example.marketstall.entity.*;
import com.example.marketstall.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final StallService stallService;
    private final TenantService tenantService;
    private final HistoryNodeService historyNodeService;

    @GetMapping("/stalls")
    public String listStalls(Model model) {
        model.addAttribute("stalls", stallService.getAllStalls());
        return "admin/stalls";
    }

    @GetMapping("/stalls/{id}")
    public String stallDetail(@PathVariable Long id, Model model) {
        StallDetailDTO detail = stallService.getStallDetail(id);
        model.addAttribute("detail", detail);
        return "admin/stall-detail";
    }

    @GetMapping("/stalls/new")
    public String newStall(Model model) {
        model.addAttribute("stall", new Stall());
        model.addAttribute("tenants", tenantService.getAllTenants());
        return "admin/stall-form";
    }

    @PostMapping("/stalls")
    public String saveStall(@ModelAttribute Stall stall) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String operator = auth.getName();
        
        stallService.saveStall(stall);
        
        if (stall.getId() == null) {
            historyNodeService.addNode(stall.getId(), "REGISTER", "摊位注册成功", operator);
        } else {
            historyNodeService.addNode(stall.getId(), "UPDATE", "摊位信息更新", operator);
        }
        
        return "redirect:/admin/stalls";
    }

    @GetMapping("/stalls/{id}/edit")
    public String editStall(@PathVariable Long id, Model model) {
        model.addAttribute("stall", stallService.getStallById(id));
        model.addAttribute("tenants", tenantService.getAllTenants());
        return "admin/stall-form";
    }

    @GetMapping("/stalls/{id}/delete")
    public String deleteStall(@PathVariable Long id) {
        stallService.deleteStall(id);
        return "redirect:/admin/stalls";
    }

    @GetMapping("/tenants")
    public String listTenants(Model model) {
        model.addAttribute("tenants", tenantService.getAllTenants());
        return "admin/tenants";
    }

    @GetMapping("/tenants/new")
    public String newTenant(Model model) {
        model.addAttribute("tenant", new Tenant());
        return "admin/tenant-form";
    }

    @PostMapping("/tenants")
    public String saveTenant(@ModelAttribute Tenant tenant) {
        tenantService.saveTenant(tenant);
        return "redirect:/admin/tenants";
    }

    @GetMapping("/tenants/{id}/edit")
    public String editTenant(@PathVariable Long id, Model model) {
        model.addAttribute("tenant", tenantService.getTenantById(id));
        return "admin/tenant-form";
    }

    @GetMapping("/tenants/{id}/delete")
    public String deleteTenant(@PathVariable Long id) {
        tenantService.deleteTenant(id);
        return "redirect:/admin/tenants";
    }

    @GetMapping("/stalls/{id}/lease")
    public String leaseStall(@PathVariable Long id, Model model) {
        Stall stall = stallService.getStallById(id);
        model.addAttribute("stall", stall);
        model.addAttribute("tenants", tenantService.getAllTenants());
        return "admin/lease-form";
    }

    @PostMapping("/stalls/{id}/lease")
    public String processLease(@PathVariable Long id, @RequestParam Long tenantId, 
                               @RequestParam LocalDate startDate, @RequestParam LocalDate endDate) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String operator = auth.getName();
        
        Stall stall = stallService.getStallById(id);
        stall.setTenantId(tenantId);
        stall.setLeaseStartDate(startDate);
        stall.setLeaseEndDate(endDate);
        stall.setStatus("leased");
        stallService.saveStall(stall);
        
        historyNodeService.addNode(id, "LEASE", "签订租赁合同，租期: " + startDate + " 至 " + endDate, operator);
        
        return "redirect:/admin/stalls/" + id;
    }

    @GetMapping("/stalls/{id}/renew")
    public String renewLease(@PathVariable Long id, Model model) {
        StallDetailDTO detail = stallService.getStallDetail(id);
        model.addAttribute("detail", detail);
        return "admin/renew-form";
    }

    @PostMapping("/stalls/{id}/renew")
    public String processRenew(@PathVariable Long id, @RequestParam LocalDate endDate) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String operator = auth.getName();
        
        Stall stall = stallService.getStallById(id);
        
        if (!stallService.getStallDetail(id).isCanRenew()) {
            return "redirect:/admin/stalls/" + id + "?error=license_expired";
        }
        
        stall.setLeaseEndDate(endDate);
        stallService.saveStall(stall);
        
        historyNodeService.addNode(id, "RENEW", "续租成功，新租期至: " + endDate, operator);
        
        return "redirect:/admin/stalls/" + id;
    }
}