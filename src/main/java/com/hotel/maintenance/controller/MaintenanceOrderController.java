package com.hotel.maintenance.controller;

import com.hotel.maintenance.entity.*;
import com.hotel.maintenance.enums.*;
import com.hotel.maintenance.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequestMapping("/maintenance")
@RequiredArgsConstructor
public class MaintenanceOrderController {

    private final MaintenanceOrderService maintenanceOrderService;
    private final RoomService roomService;
    private final EmployeeService employeeService;

    @GetMapping
    public String list(@RequestParam(required = false) MaintenanceStatus status, Model model) {
        List<MaintenanceOrder> orders;
        if (status != null) {
            orders = maintenanceOrderService.findByStatus(status);
        } else {
            orders = maintenanceOrderService.findAll();
        }
        model.addAttribute("activeMenu", "maintenance");
        model.addAttribute("orders", orders);
        model.addAttribute("statuses", MaintenanceStatus.values());
        model.addAttribute("currentStatus", status);
        return "maintenance/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        MaintenanceOrder order = maintenanceOrderService.findById(id);
        if (order == null) {
            return "redirect:/maintenance";
        }
        List<AuditNode> auditNodes = maintenanceOrderService.getAuditNodes(id);
        List<AffectedOrder> affectedOrders = maintenanceOrderService.getAffectedOrders(id);
        List<MaintenanceRecord> records = maintenanceOrderService.getMaintenanceRecords(id);
        long outageHours = maintenanceOrderService.calculateOutageHours(order);

        model.addAttribute("activeMenu", "maintenance");
        model.addAttribute("order", order);
        model.addAttribute("auditNodes", auditNodes);
        model.addAttribute("affectedOrders", affectedOrders);
        model.addAttribute("maintenanceRecords", records);
        model.addAttribute("outageHours", outageHours);
        boolean cleaningPassed = order.getStatus() == MaintenanceStatus.CLEANING_PASSED;
        if (!cleaningPassed) {
            cleaningPassed = auditNodes.stream()
                    .anyMatch(node -> node.getStatus() == MaintenanceStatus.CLEANING_PASSED);
        }
        model.addAttribute("canRestore", cleaningPassed);
        model.addAttribute("housekeepers", employeeService.findHousekeepingSupervisors());
        model.addAttribute("dutyManagers", employeeService.findDutyManagers());
        model.addAttribute("engineers", employeeService.findEngineers());
        return "maintenance/detail";
    }

    @GetMapping("/submit")
    public String showSubmitForm(Model model) {
        model.addAttribute("activeMenu", "maintenance");
        model.addAttribute("rooms", roomService.findAvailableRooms());
        model.addAttribute("faultTypes", FaultType.values());
        model.addAttribute("receptionists", employeeService.findReceptionists());
        return "maintenance/submit";
    }

    @PostMapping("/submit")
    public String submitFault(@RequestParam Long roomId,
                              @RequestParam FaultType faultType,
                              @RequestParam String description,
                              @RequestParam Long reporterId,
                              RedirectAttributes redirectAttributes) {
        try {
            MaintenanceOrder order = maintenanceOrderService.submitFault(roomId, faultType, description, reporterId);
            redirectAttributes.addFlashAttribute("success", "故障提交成功，工单编号：" + order.getOrderNo());
            return "redirect:/maintenance/" + order.getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/maintenance/submit";
        }
    }

    @PostMapping("/{id}/assign")
    public String assignEngineer(@PathVariable Long id,
                                 @RequestParam Long engineerId,
                                 @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime estimatedTime,
                                 RedirectAttributes redirectAttributes) {
        try {
            maintenanceOrderService.assignEngineer(id, engineerId, estimatedTime);
            redirectAttributes.addFlashAttribute("success", "派工成功");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/maintenance/" + id;
    }

    @PostMapping("/{id}/start-repair")
    public String startRepair(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            maintenanceOrderService.startRepair(id);
            redirectAttributes.addFlashAttribute("success", "开始维修");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/maintenance/" + id;
    }

    @PostMapping("/{id}/complete-repair")
    public String completeRepair(@PathVariable Long id,
                                 @RequestParam String repairReport,
                                 @RequestParam(required = false) Double laborCost,
                                 @RequestParam(required = false) Double partsCost,
                                 @RequestParam(required = false) String partsUsed,
                                 RedirectAttributes redirectAttributes) {
        try {
            maintenanceOrderService.completeRepair(id, repairReport, laborCost, partsCost, partsUsed);
            redirectAttributes.addFlashAttribute("success", "维修完成");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/maintenance/" + id;
    }

    @PostMapping("/{id}/check-cleaning")
    public String checkCleaning(@PathVariable Long id,
                                @RequestParam Long housekeeperId,
                                @RequestParam boolean passed,
                                @RequestParam String cleaningReport,
                                RedirectAttributes redirectAttributes) {
        try {
            maintenanceOrderService.checkCleaning(id, housekeeperId, passed, cleaningReport);
            redirectAttributes.addFlashAttribute("success", passed ? "清洁检查通过" : "清洁检查未通过，需重新清洁");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/maintenance/" + id;
    }

    @PostMapping("/{id}/escalate-complaint")
    public String escalateComplaint(@PathVariable Long id,
                                    @RequestParam String complaintDescription,
                                    RedirectAttributes redirectAttributes) {
        try {
            maintenanceOrderService.escalateComplaint(id, complaintDescription);
            redirectAttributes.addFlashAttribute("success", "客诉已升级");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/maintenance/" + id;
    }

    @PostMapping("/{id}/review")
    public String reviewRestore(@PathVariable Long id,
                                @RequestParam Long reviewerId,
                                @RequestParam boolean restore,
                                @RequestParam String reviewComment,
                                RedirectAttributes redirectAttributes) {
        try {
            MaintenanceOrder order = maintenanceOrderService.findById(id);
            if (order == null) {
                throw new IllegalArgumentException("工单不存在");
            }
            if (restore) {
                boolean cleaningPassed = order.getStatus() == MaintenanceStatus.CLEANING_PASSED;
                if (!cleaningPassed) {
                    List<AuditNode> auditNodes = maintenanceOrderService.getAuditNodes(id);
                    cleaningPassed = auditNodes.stream()
                            .anyMatch(node -> node.getStatus() == MaintenanceStatus.CLEANING_PASSED);
                }
                if (!cleaningPassed) {
                    throw new IllegalStateException("清洁检查未通过，禁止恢复售卖！请先完成清洁检查。");
                }
            }
            maintenanceOrderService.reviewRestore(id, reviewerId, restore, reviewComment);
            redirectAttributes.addFlashAttribute("success", restore ? "已恢复售卖" : "已继续停卖");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/maintenance/" + id;
    }

    @PostMapping("/{id}/add-affected-order")
    public String addAffectedOrder(@PathVariable Long id,
                                   @RequestParam String orderNo,
                                   @RequestParam String guestName,
                                   @RequestParam String guestPhone,
                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInDate,
                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOutDate,
                                   @RequestParam(required = false) Double orderAmount,
                                   @RequestParam String handlingMethod,
                                   @RequestParam(required = false) Double compensationAmount,
                                   @RequestParam(required = false) String remark,
                                   RedirectAttributes redirectAttributes) {
        try {
            MaintenanceOrder order = maintenanceOrderService.findById(id);
            AffectedOrder affectedOrder = new AffectedOrder();
            affectedOrder.setMaintenanceOrder(order);
            affectedOrder.setOrderNo(orderNo);
            affectedOrder.setGuestName(guestName);
            affectedOrder.setGuestPhone(guestPhone);
            affectedOrder.setCheckInDate(checkInDate);
            affectedOrder.setCheckOutDate(checkOutDate);
            affectedOrder.setOrderAmount(orderAmount);
            affectedOrder.setHandlingMethod(handlingMethod);
            affectedOrder.setCompensationAmount(compensationAmount);
            affectedOrder.setRemark(remark);
            maintenanceOrderService.addAffectedOrder(affectedOrder);
            redirectAttributes.addFlashAttribute("success", "已添加受影响订单");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/maintenance/" + id;
    }
}
