
package com.example.cinema.controller;

import com.example.cinema.entity.CompensationRecord;
import com.example.cinema.entity.CompensationStatus;
import com.example.cinema.entity.InterruptRecord;
import com.example.cinema.service.CompensationService;
import com.example.cinema.service.InterruptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@Controller
@RequestMapping("/compensations")
public class CompensationController {

    @Autowired
    private CompensationService compensationService;

    @Autowired
    private InterruptService interruptService;

    @GetMapping
    public String list(Model model) {
        List<CompensationRecord> compensations = compensationService.getAllCompensationRecords();
        model.addAttribute("compensations", compensations);
        return "compensation-list";
    }

    @GetMapping("/pending")
    public String pendingList(Model model) {
        List<CompensationRecord> compensations = compensationService.getPendingCompensations();
        model.addAttribute("compensations", compensations);
        return "compensation-list";
    }

    @GetMapping("/create")
    public String showCreateForm(Model model) {
        List<InterruptRecord> unresolvedInterrupts = interruptService.getUnresolvedInterrupts();
        model.addAttribute("interrupts", unresolvedInterrupts);
        return "compensation-create";
    }

    @PostMapping("/create")
    public String submitCompensation(@RequestParam("interruptId") Long interruptId,
            @RequestParam("affectedAudienceCount") Integer affectedAudienceCount,
            @RequestParam("compensationAmount") BigDecimal compensationAmount,
            @RequestParam("compensationType") String compensationType,
            @RequestParam("submitterName") String submitterName) {
        
        compensationService.submitCompensation(interruptId, affectedAudienceCount, 
                compensationAmount, compensationType, submitterName);
        
        return "redirect:/compensations";
    }

    @GetMapping("/review/{id}")
    public String showReviewForm(@PathVariable("id") Long id, Model model) {
        CompensationRecord compensation = compensationService.getAllCompensationRecords().stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("补偿记录不存在"));
        
        model.addAttribute("compensation", compensation);
        model.addAttribute("compensationStatuses", CompensationStatus.values());
        
        return "compensation-review";
    }

    @PostMapping("/review/{id}")
    public String reviewCompensation(@PathVariable("id") Long id,
            @RequestParam("reviewerName") String reviewerName,
            @RequestParam("status") CompensationStatus status,
            @RequestParam(value = "reviewNote", required = false) String reviewNote) {
        
        compensationService.reviewCompensation(id, reviewerName, status, reviewNote);
        
        return "redirect:/compensations";
    }

    @PostMapping("/archive/{id}")
    public String archiveCompensation(@PathVariable("id") Long id) {
        compensationService.archiveCompensation(id);
        return "redirect:/compensations";
    }
}
