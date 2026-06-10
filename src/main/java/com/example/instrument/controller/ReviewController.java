package com.example.instrument.controller;

import com.example.instrument.entity.AbnormalRecord;
import com.example.instrument.entity.Instrument;
import com.example.instrument.entity.IssueRecord;
import com.example.instrument.repository.AbnormalRecordRepository;
import com.example.instrument.repository.InstrumentRepository;
import com.example.instrument.repository.IssueRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/review")
@RequiredArgsConstructor
public class ReviewController {
    
    private final IssueRecordRepository issueRecordRepository;
    private final AbnormalRecordRepository abnormalRecordRepository;
    private final InstrumentRepository instrumentRepository;
    
    @GetMapping
    public String review(Model model) {
        List<IssueRecord> allIssues = issueRecordRepository.findAll();
        List<AbnormalRecord> allAbnormals = abnormalRecordRepository.findAll();
        List<Instrument> allInstruments = instrumentRepository.findAll();
        
        Map<String, Long> issueByDepartment = allIssues.stream()
                .collect(Collectors.groupingBy(IssueRecord::getDepartment, Collectors.counting()));
        
        Map<String, Long> instrumentByType = allInstruments.stream()
                .collect(Collectors.groupingBy(Instrument::getInstrumentType, Collectors.counting()));
        
        Map<String, Long> abnormalByType = allAbnormals.stream()
                .collect(Collectors.groupingBy(a -> a.getAbnormalType().name(), Collectors.counting()));
        
        List<Long> turnoverDurations = allIssues.stream()
                .filter(i -> i.getInstrumentPackage() != null && i.getInstrumentPackage().getCreateTime() != null)
                .map(i -> {
                    LocalDateTime createTime = i.getInstrumentPackage().getCreateTime();
                    LocalDateTime issueTime = i.getCreateTime();
                    return Duration.between(createTime, issueTime).toHours();
                })
                .collect(Collectors.toList());
        
        double avgTurnoverHours = turnoverDurations.isEmpty() ? 0 : 
                turnoverDurations.stream().mapToLong(Long::longValue).average().orElse(0);
        
        long maxTurnoverHours = turnoverDurations.isEmpty() ? 0 : 
                turnoverDurations.stream().mapToLong(Long::longValue).max().orElse(0);
        
        long minTurnoverHours = turnoverDurations.isEmpty() ? 0 : 
                turnoverDurations.stream().mapToLong(Long::longValue).min().orElse(0);
        
        Map<String, Long> issueByOperator = allIssues.stream()
                .collect(Collectors.groupingBy(IssueRecord::getOperator, Collectors.counting()));
        
        List<Map<String, Object>> abnormalByDept = allAbnormals.stream()
                .filter(a -> a.getInstrumentPackage() != null)
                .collect(Collectors.groupingBy(
                        a -> {
                            String dept = "未知";
                            List<IssueRecord> issues = issueRecordRepository.findByInstrumentPackageId(a.getInstrumentPackage().getId());
                            if (!issues.isEmpty()) {
                                dept = issues.get(0).getDepartment();
                            }
                            return dept;
                        },
                        Collectors.groupingBy(a -> a.getAbnormalType().name(), Collectors.counting())
                ))
                .entrySet().stream()
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("department", e.getKey());
                    map.put("details", e.getValue());
                    map.put("total", e.getValue().values().stream().mapToLong(Long::longValue).sum());
                    return map;
                })
                .collect(Collectors.toList());
        
        model.addAttribute("totalPackages", allIssues.size());
        model.addAttribute("totalAbnormals", allAbnormals.size());
        model.addAttribute("issueByDepartment", issueByDepartment);
        model.addAttribute("instrumentByType", instrumentByType);
        model.addAttribute("abnormalByType", abnormalByType);
        model.addAttribute("avgTurnoverHours", String.format("%.2f", avgTurnoverHours));
        model.addAttribute("maxTurnoverHours", maxTurnoverHours);
        model.addAttribute("minTurnoverHours", minTurnoverHours);
        model.addAttribute("issueByOperator", issueByOperator);
        model.addAttribute("abnormalByDept", abnormalByDept);

        
        return "review/index";
    }
}