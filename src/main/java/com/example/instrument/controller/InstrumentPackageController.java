package com.example.instrument.controller;

import com.example.instrument.entity.*;
import com.example.instrument.entity.InstrumentPackage.PackageStatus;
import com.example.instrument.entity.InventoryRecord.InventoryResult;
import com.example.instrument.entity.ReceiveRecord.ReceiveResult;
import com.example.instrument.entity.ReviewRecord.ReviewResult;
import com.example.instrument.repository.InstrumentRepository;
import com.example.instrument.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Controller
@RequestMapping("/packages")
@RequiredArgsConstructor
public class InstrumentPackageController {
    
    private final InstrumentPackageService packageService;
    private final InventoryService inventoryService;
    private final SterilizationService sterilizationService;
    private final ReceiveService receiveService;
    private final ReviewService reviewService;
    private final IssueService issueService;
    private final AbnormalService abnormalService;
    private final InstrumentRepository instrumentRepository;
    
    @GetMapping
    public String list(Model model, @RequestParam(required = false) String status) {
        List<InstrumentPackage> packages;
        if (status != null && !status.isEmpty()) {
            try {
                PackageStatus packageStatus = PackageStatus.valueOf(status.toUpperCase());
                packages = packageService.findByStatus(packageStatus);
            } catch (IllegalArgumentException e) {
                packages = packageService.findAll();
            }
        } else {
            packages = packageService.findAll();
        }
        
        Map<Long, List<Instrument>> instrumentsMap = new HashMap<>();
        Map<Long, SterilizationBatch> latestBatchMap = new HashMap<>();
        
        for (InstrumentPackage pkg : packages) {
            instrumentsMap.put(pkg.getId(), instrumentRepository.findByInstrumentPackageId(pkg.getId()));
            
            Optional<SterilizationBatch> batch = sterilizationService.findLatestByPackageId(pkg.getId());
            batch.ifPresent(b -> latestBatchMap.put(pkg.getId(), b));
        }
        
        model.addAttribute("packages", packages);
        model.addAttribute("instrumentsMap", instrumentsMap);
        model.addAttribute("latestBatchMap", latestBatchMap);
        model.addAttribute("statusFilter", status);
        model.addAttribute("statuses", PackageStatus.values());
        
        return "package/list";
    }
    
    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        InstrumentPackage instrumentPackage = packageService.findById(id)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        List<Instrument> instruments = instrumentRepository.findByInstrumentPackageId(id);
        List<InventoryRecord> inventoryRecords = inventoryService.findByPackageId(id);
        List<SterilizationBatch> sterilizationBatches = sterilizationService.findByPackageId(id);
        List<ReceiveRecord> receiveRecords = receiveService.findByPackageId(id);
        List<ReviewRecord> reviewRecords = reviewService.findByPackageId(id);
        List<IssueRecord> issueRecords = issueService.findByPackageId(id);
        List<AbnormalRecord> abnormalRecords = abnormalService.findByPackageId(id);
        
        SterilizationBatch latestBatch = sterilizationService.findLatestByPackageId(id).orElse(null);
        boolean isExpired = latestBatch != null && latestBatch.isExpired();
        
        List<Object> historyNodes = new ArrayList<>();
        for (InventoryRecord record : inventoryRecords) {
            historyNodes.add(Map.of("type", "inventory", "time", record.getCreateTime(), 
                    "operator", record.getOperator(), "result", record.getResult()));
        }
        for (SterilizationBatch batch : sterilizationBatches) {
            historyNodes.add(Map.of("type", "sterilization", "time", batch.getCreateTime(), 
                    "operator", batch.getOperator(), "batchNo", batch.getBatchNo()));
        }
        for (ReceiveRecord record : receiveRecords) {
            historyNodes.add(Map.of("type", "receive", "time", record.getCreateTime(), 
                    "operator", record.getOperator(), "result", record.getResult(),
                    "department", record.getDepartment()));
        }
        for (ReviewRecord record : reviewRecords) {
            historyNodes.add(Map.of("type", "review", "time", record.getCreateTime(), 
                    "operator", record.getOperator(), "result", record.getResult()));
        }
        for (IssueRecord record : issueRecords) {
            historyNodes.add(Map.of("type", "issue", "time", record.getCreateTime(), 
                    "operator", record.getOperator(), "department", record.getDepartment()));
        }
        historyNodes.sort((a, b) -> ((LocalDateTime) b.get("time")).compareTo((LocalDateTime) a.get("time")));
        
        model.addAttribute("instrumentPackage", instrumentPackage);
        model.addAttribute("instruments", instruments);
        model.addAttribute("inventoryRecords", inventoryRecords);
        model.addAttribute("sterilizationBatches", sterilizationBatches);
        model.addAttribute("receiveRecords", receiveRecords);
        model.addAttribute("reviewRecords", reviewRecords);
        model.addAttribute("issueRecords", issueRecords);
        model.addAttribute("abnormalRecords", abnormalRecords);
        model.addAttribute("latestBatch", latestBatch);
        model.addAttribute("isExpired", isExpired);
        model.addAttribute("historyNodes", historyNodes);
        
        return "package/detail";
    }
    
    @GetMapping("/{id}/inventory")
    public String showInventoryForm(@PathVariable Long id, Model model) {
        InstrumentPackage instrumentPackage = packageService.findById(id)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        List<Instrument> instruments = instrumentRepository.findByInstrumentPackageId(id);
        int expectedQuantity = instruments.stream().mapToInt(Instrument::getQuantity).sum();
        
        model.addAttribute("package", instrumentPackage);
        model.addAttribute("instruments", instruments);
        model.addAttribute("expectedQuantity", expectedQuantity);
        
        return "package/inventory";
    }
    
    @PostMapping("/{id}/inventory")
    public String submitInventory(@PathVariable Long id, @RequestParam Integer actualQuantity,
                                  @RequestParam String operator, @RequestParam(required = false) String notes) {
        inventoryService.createInventory(id, actualQuantity, 
                instrumentRepository.findByInstrumentPackageId(id).stream()
                        .mapToInt(Instrument::getQuantity).sum(),
                operator, notes);
        return "redirect:/packages/" + id;
    }
    
    @GetMapping("/{id}/sterilization")
    public String showSterilizationForm(@PathVariable Long id, Model model) {
        InstrumentPackage instrumentPackage = packageService.findById(id)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        model.addAttribute("package", instrumentPackage);
        
        return "package/sterilization";
    }
    
    @PostMapping("/{id}/sterilization")
    public String submitSterilization(@PathVariable Long id, @RequestParam String sterilizerNo,
                                      @RequestParam LocalDate sterilizationDate,
                                      @RequestParam LocalDate expiryDate,
                                      @RequestParam String operator,
                                      @RequestParam(required = false) String notes) {
        sterilizationService.createBatch(id, sterilizerNo, sterilizationDate, expiryDate, operator, notes);
        return "redirect:/packages/" + id;
    }
    
    @GetMapping("/{id}/receive")
    public String showReceiveForm(@PathVariable Long id, Model model) {
        InstrumentPackage instrumentPackage = packageService.findById(id)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        model.addAttribute("package", instrumentPackage);
        
        return "package/receive";
    }
    
    @PostMapping("/{id}/receive")
    public String submitReceive(@PathVariable Long id, @RequestParam String department,
                                @RequestParam ReceiveResult result,
                                @RequestParam String operator,
                                @RequestParam(required = false) String notes) {
        receiveService.createReceive(id, department, result, operator, notes);
        return "redirect:/packages/" + id;
    }
    
    @GetMapping("/{id}/review")
    public String showReviewForm(@PathVariable Long id, Model model) {
        InstrumentPackage instrumentPackage = packageService.findById(id)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        SterilizationBatch latestBatch = sterilizationService.findLatestByPackageId(id).orElse(null);
        boolean isExpired = latestBatch != null && latestBatch.isExpired();
        
        model.addAttribute("package", instrumentPackage);
        model.addAttribute("isExpired", isExpired);
        
        return "package/review";
    }
    
    @PostMapping("/{id}/review")
    public String submitReview(@PathVariable Long id, @RequestParam ReviewResult result,
                               @RequestParam String operator,
                               @RequestParam(required = false) String notes) {
        try {
            reviewService.createReview(id, result, operator, notes);
        } catch (RuntimeException e) {
            return "redirect:/packages/" + id + "/review?error=" + e.getMessage();
        }
        return "redirect:/packages/" + id;
    }
    
    @GetMapping("/{id}/issue")
    public String showIssueForm(@PathVariable Long id, Model model) {
        InstrumentPackage instrumentPackage = packageService.findById(id)
                .orElseThrow(() -> new RuntimeException("器械包不存在"));
        
        SterilizationBatch latestBatch = sterilizationService.findLatestByPackageId(id).orElse(null);
        boolean isExpired = latestBatch != null && latestBatch.isExpired();
        
        model.addAttribute("package", instrumentPackage);
        model.addAttribute("isExpired", isExpired);
        
        return "package/issue";
    }
    
    @PostMapping("/{id}/issue")
    public String submitIssue(@PathVariable Long id, @RequestParam String department,
                              @RequestParam String operator,
                              @RequestParam(required = false) String notes) {
        try {
            issueService.createIssue(id, department, operator, notes);
        } catch (RuntimeException e) {
            return "redirect:/packages/" + id + "/issue?error=" + e.getMessage();
        }
        return "redirect:/packages/" + id;
    }
    
    @PostMapping("/{id}/return")
    public String submitReturn(@PathVariable Long id, @RequestParam String operator,
                               @RequestParam(required = false) String notes) {
        issueService.returnPackage(id, operator, notes);
        return "redirect:/packages/" + id;
    }
}