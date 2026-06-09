package com.gasstation.controller;

import com.gasstation.entity.DiscrepancyType;
import com.gasstation.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/summary")
public class SummaryController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    public String summary(Model model) {
        List<Object[]> byDiscrepancyType = inventoryService.getSummaryByDiscrepancyType();
        List<Object[]> byStation = inventoryService.getSummaryByStation();
        List<Object[]> byProduct = inventoryService.getSummaryByProduct();

        Map<String, Long> discrepancyCount = new HashMap<>();
        discrepancyCount.put("NORMAL", 0L);
        discrepancyCount.put("GAUGE_ERROR", 0L);
        discrepancyCount.put("DELIVERY_MISMATCH", 0L);
        discrepancyCount.put("EXCESS_LOSS", 0L);

        for (Object[] row : byDiscrepancyType) {
            DiscrepancyType type = (DiscrepancyType) row[0];
            Long count = (Long) row[1];
            discrepancyCount.put(type.name(), count);
        }

        model.addAttribute("byDiscrepancyType", byDiscrepancyType);
        model.addAttribute("byStation", byStation);
        model.addAttribute("byProduct", byProduct);
        model.addAttribute("discrepancyCount", discrepancyCount);

        long totalCount = discrepancyCount.values().stream().mapToLong(Long::longValue).sum();
        model.addAttribute("totalCount", totalCount);

        return "summary/index";
    }
}
