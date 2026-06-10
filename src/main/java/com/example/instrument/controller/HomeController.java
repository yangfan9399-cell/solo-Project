package com.example.instrument.controller;

import com.example.instrument.entity.InstrumentPackage;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;
import com.example.instrument.service.AbnormalService;
import com.example.instrument.service.InstrumentPackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class HomeController {
    
    private final InstrumentPackageService packageService;
    private final AbnormalService abnormalService;
    
    @GetMapping("/")
    public String home(Model model) {
        List<InstrumentPackage> allPackages = packageService.findAll();
        
        long pendingInventory = allPackages.stream()
                .filter(p -> p.getStatus() == PackageStatus.PENDING_INVENTORY).count();
        
        long pendingReview = allPackages.stream()
                .filter(p -> p.getStatus() == PackageStatus.PENDING_REVIEW).count();
        
        long released = allPackages.stream()
                .filter(p -> p.getStatus() == PackageStatus.RELEASED).count();
        
        long abnormal = allPackages.stream()
                .filter(p -> p.getStatus() == PackageStatus.ABNORMAL).count();
        
        long pendingAbnormals = abnormalService.findPendingAbnormals().size();
        
        List<InstrumentPackage> recentPackages = allPackages.stream()
                .limit(10).toList();
        
        model.addAttribute("totalPackages", allPackages.size());
        model.addAttribute("pendingInventory", pendingInventory);
        model.addAttribute("pendingReview", pendingReview);
        model.addAttribute("released", released);
        model.addAttribute("abnormal", abnormal);
        model.addAttribute("pendingAbnormals", pendingAbnormals);
        model.addAttribute("recentPackages", recentPackages);
        
        return "home";
    }
}