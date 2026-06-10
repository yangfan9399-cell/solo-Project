
package com.example.cinema.controller;

import com.example.cinema.entity.InterruptRecord;
import com.example.cinema.service.InterruptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/interrupts")
public class InterruptController {

    @Autowired
    private InterruptService interruptService;

    @GetMapping
    public String list(Model model) {
        List<InterruptRecord> interrupts = interruptService.getAllInterruptRecords();
        model.addAttribute("interrupts", interrupts);
        return "interrupt-list";
    }

    @GetMapping("/unresolved")
    public String unresolvedList(Model model) {
        List<InterruptRecord> interrupts = interruptService.getUnresolvedInterrupts();
        model.addAttribute("interrupts", interrupts);
        return "interrupt-list";
    }

    @GetMapping("/resolve/{id}")
    public String showResolveForm(@PathVariable("id") Long id, Model model) {
        InterruptRecord interrupt = interruptService.getAllInterruptRecords().stream()
                .filter(i -> i.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("中断记录不存在"));
        
        model.addAttribute("interrupt", interrupt);
        return "interrupt-resolve";
    }

    @PostMapping("/resolve/{id}")
    public String resolveInterrupt(@PathVariable("id") Long id,
            @RequestParam("resolutionNote") String resolutionNote) {
        
        interruptService.resolveInterrupt(id, resolutionNote);
        
        return "redirect:/interrupts";
    }
}
