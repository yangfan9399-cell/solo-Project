package com.gasstation.controller;

import com.gasstation.entity.*;
import com.gasstation.service.InventoryService;
import com.gasstation.service.MasterDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private MasterDataService masterDataService;

    @GetMapping
    public String list(
            @RequestParam(required = false) Long stationId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) InventoryStatus status,
            @RequestParam(required = false) DiscrepancyType discrepancyType,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate,
            Model model) {

        List<InventoryRecord> records = inventoryService.findByConditions(
                stationId, productId, status, discrepancyType, startDate, endDate);

        model.addAttribute("records", records);
        model.addAttribute("stations", masterDataService.getAllStations());
        model.addAttribute("products", masterDataService.getAllProducts());
        model.addAttribute("statuses", InventoryStatus.values());
        model.addAttribute("discrepancyTypes", DiscrepancyType.values());
        model.addAttribute("stationId", stationId);
        model.addAttribute("productId", productId);
        model.addAttribute("status", status);
        model.addAttribute("discrepancyType", discrepancyType);
        model.addAttribute("startDate", startDate);
        model.addAttribute("endDate", endDate);

        return "inventory/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        InventoryRecord record = inventoryService.findById(id);
        if (record == null) {
            return "redirect:/inventory";
        }

        List<InventoryHistory> history = inventoryService.getHistory(id);
        List<DeliveryOrder> deliveries = masterDataService.getDeliveryOrdersByTankAndDate(
                record.getTank().getId(),
                record.getInventoryDate().minusDays(7),
                record.getInventoryDate());

        model.addAttribute("record", record);
        model.addAttribute("history", history);
        model.addAttribute("deliveries", deliveries);
        model.addAttribute("canReview", record.getStatus() == InventoryStatus.PENDING_REVIEW);
        model.addAttribute("canDispose", record.getStatus() == InventoryStatus.PENDING_DISPOSAL);
        model.addAttribute("canAdjust", record.getStatus() == InventoryStatus.PENDING_DISPOSAL
                && record.getDiscrepancyType() != DiscrepancyType.GAUGE_ERROR);
        model.addAttribute("canInvestigate", record.getStatus() == InventoryStatus.PENDING_DISPOSAL);
        model.addAttribute("canArchive", record.getStatus() == InventoryStatus.PENDING_DISPOSAL
                || record.getStatus() == InventoryStatus.INVESTIGATING
                || record.getStatus() == InventoryStatus.ADJUSTED);

        return "inventory/detail";
    }

    @GetMapping("/create")
    public String createForm(Model model) {
        model.addAttribute("tanks", masterDataService.getAllTanks());
        model.addAttribute("stations", masterDataService.getAllStations());
        model.addAttribute("record", new InventoryRecord());
        model.addAttribute("today", LocalDate.now());
        return "inventory/create";
    }

    @PostMapping("/create")
    public String create(@ModelAttribute InventoryRecord record,
                         @RequestParam(required = false, defaultValue = "张三") String operator,
                         RedirectAttributes redirectAttributes) {
        try {
            InventoryRecord saved = inventoryService.createInventory(record, operator);
            redirectAttributes.addFlashAttribute("success", "盘点登记成功");
            return "redirect:/inventory/" + saved.getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "登记失败：" + e.getMessage());
            return "redirect:/inventory/create";
        }
    }

    @PostMapping("/{id}/review")
    public String review(@PathVariable Long id,
                         @RequestParam boolean pass,
                         @RequestParam(required = false) String remark,
                         @RequestParam(required = false, defaultValue = "李四") String operator,
                         RedirectAttributes redirectAttributes) {
        try {
            InventoryRecord record = inventoryService.reviewInventory(id, pass, remark, operator);
            redirectAttributes.addFlashAttribute("success", pass ? "复核通过" : "已驳回");
            return "redirect:/inventory/" + record.getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "操作失败：" + e.getMessage());
            return "redirect:/inventory/" + id;
        }
    }

    @PostMapping("/{id}/adjust")
    public String adjust(@PathVariable Long id,
                         @RequestParam BigDecimal adjustedVolume,
                         @RequestParam(required = false) String remark,
                         @RequestParam(required = false, defaultValue = "王五") String operator,
                         RedirectAttributes redirectAttributes) {
        try {
            InventoryRecord record = inventoryService.adjustInventory(id, adjustedVolume, remark, operator);
            String message = buildAdjustSuccessMessage(record);
            redirectAttributes.addFlashAttribute("success", message);
            return "redirect:/inventory/" + record.getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "调整失败：" + e.getMessage());
            return "redirect:/inventory/" + id;
        }
    }

    private String buildAdjustSuccessMessage(InventoryRecord record) {
        if (record.getDiscrepancyType() == DiscrepancyType.DELIVERY_MISMATCH) {
            return "库存已按实收量调整，请注意跟踪配送差异后续核实进展";
        } else if (record.getDiscrepancyType() == DiscrepancyType.EXCESS_LOSS) {
            return "库存已调整，请持续跟踪损耗原因及整改效果";
        } else {
            return "库存调整成功";
        }
    }

    @PostMapping("/{id}/investigate")
    public String investigate(@PathVariable Long id,
                              @RequestParam(required = false) String remark,
                              @RequestParam(required = false, defaultValue = "王五") String operator,
                              RedirectAttributes redirectAttributes) {
        try {
            InventoryRecord record = inventoryService.investigateInventory(id, remark, operator);
            String message = buildInvestigateSuccessMessage(record);
            redirectAttributes.addFlashAttribute("success", message);
            return "redirect:/inventory/" + record.getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "操作失败：" + e.getMessage());
            return "redirect:/inventory/" + id;
        }
    }

    private String buildInvestigateSuccessMessage(InventoryRecord record) {
        if (record.getDiscrepancyType() == DiscrepancyType.GAUGE_ERROR) {
            return "已安排检修，请跟进液位仪检修进度，设备恢复后请重新盘点";
        } else if (record.getDiscrepancyType() == DiscrepancyType.DELIVERY_MISMATCH) {
            return "已启动追查，请尽快与承运方核实配送差异";
        } else if (record.getDiscrepancyType() == DiscrepancyType.EXCESS_LOSS) {
            return "已启动追查，请尽快查明损耗原因并落实整改";
        } else {
            return "已启动追查";
        }
    }

    @PostMapping("/{id}/archive")
    public String archive(@PathVariable Long id,
                          @RequestParam(required = false) String remark,
                          @RequestParam(required = false, defaultValue = "王五") String operator,
                          RedirectAttributes redirectAttributes) {
        try {
            InventoryRecord record = inventoryService.archiveInventory(id, remark, operator);
            String message = buildArchiveSuccessMessage(record);
            redirectAttributes.addFlashAttribute("success", message);
            return "redirect:/inventory/" + record.getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "操作失败：" + e.getMessage());
            return "redirect:/inventory/" + id;
        }
    }

    private String buildArchiveSuccessMessage(InventoryRecord record) {
        if (record.getDiscrepancyType() == DiscrepancyType.GAUGE_ERROR) {
            return "已归档，请持续跟进液位仪修复进度，修复后重新盘点";
        } else if (record.getDiscrepancyType() == DiscrepancyType.EXCESS_LOSS) {
            return "已归档，请跟踪损耗整改情况，下次盘点持续关注损耗率";
        } else if (record.getDiscrepancyType() == DiscrepancyType.DELIVERY_MISMATCH) {
            return "已归档，请关注配送环节质量，加强配送验收管控";
        } else {
            return "已归档";
        }
    }
}
