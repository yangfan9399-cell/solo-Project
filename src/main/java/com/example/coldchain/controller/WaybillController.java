package com.example.coldchain.controller;

import com.example.coldchain.entity.*;
import com.example.coldchain.enums.WaybillStatus;
import com.example.coldchain.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Controller
@RequestMapping("/waybills")
@RequiredArgsConstructor
public class WaybillController {

    private final WaybillService waybillService;
    private final TemperatureService temperatureService;
    private final ExceptionService exceptionService;
    private final DisposalService disposalService;
    private final CompensationService compensationService;
    private final VehicleService vehicleService;
    private final DriverService driverService;

    @GetMapping
    public String list(Model model) {
        List<Waybill> waybills = waybillService.findAll();
        model.addAttribute("waybills", waybills);
        return "waybill/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        Waybill waybill = waybillService.findById(id)
                .orElseThrow(() -> new RuntimeException("运单不存在"));
        
        List<TemperatureRecord> temperatureRecords = temperatureService.findByWaybillId(id);
        List<ExceptionRecord> exceptions = exceptionService.findByWaybillId(id);
        List<DisposalRecord> disposals = disposalService.findByWaybillId(id);
        Optional<Compensation> compensation = compensationService.findByWaybillId(id);
        Optional<Vehicle> vehicle = vehicleService.findById(waybill.getVehicleId());
        Optional<Driver> driver = driverService.findById(waybill.getDriverId());
        
        boolean hasUndisposedExceptions = exceptionService.hasUndisposedExceptions(id);

        model.addAttribute("waybill", waybill);
        model.addAttribute("temperatureRecords", temperatureRecords);
        model.addAttribute("exceptions", exceptions);
        model.addAttribute("disposals", disposals);
        model.addAttribute("compensation", compensation.orElse(null));
        model.addAttribute("vehicle", vehicle.orElse(null));
        model.addAttribute("driver", driver.orElse(null));
        model.addAttribute("hasUndisposedExceptions", hasUndisposedExceptions);

        return "waybill/detail";
    }

    @PostMapping("/{id}/sign")
    public String sign(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        Waybill waybill = waybillService.findById(id)
                .orElseThrow(() -> new RuntimeException("运单不存在"));

        if (exceptionService.hasUndisposedExceptions(id)) {
            redirectAttributes.addFlashAttribute("error", "存在未处置的异常记录，禁止签收");
            return "redirect:/waybills/" + id;
        }

        waybill.setStatus(WaybillStatus.SIGNED);
        waybill.setSignedTime(LocalDateTime.now());
        waybillService.save(waybill);
        
        redirectAttributes.addFlashAttribute("success", "签收成功");
        return "redirect:/waybills/" + id;
    }

    @PostMapping("/{id}/submit-disposal")
    public String submitDisposal(@PathVariable Long id, 
                                 @RequestParam Long exceptionId,
                                 @RequestParam String disposalMethod,
                                 RedirectAttributes redirectAttributes) {
        disposalService.createDisposal(exceptionId, id, 1L, "司机张三", disposalMethod);
        redirectAttributes.addFlashAttribute("success", "处置申请已提交");
        return "redirect:/waybills/" + id;
    }

    @PostMapping("/{id}/complete-disposal")
    public String completeDisposal(@PathVariable Long id,
                                   @RequestParam Long disposalId,
                                   @RequestParam String disposalResult,
                                   RedirectAttributes redirectAttributes) {
        disposalService.completeDisposal(disposalId, disposalResult);
        redirectAttributes.addFlashAttribute("success", "处置已完成");
        return "redirect:/waybills/" + id;
    }

    @PostMapping("/{id}/assess-damage")
    public String assessDamage(@PathVariable Long id,
                               @RequestParam String damageDescription,
                               @RequestParam BigDecimal damagePercentage,
                               @RequestParam BigDecimal claimedAmount,
                               RedirectAttributes redirectAttributes) {
        Compensation compensation = compensationService.findByWaybillId(id).orElse(null);
        if (compensation == null) {
            compensationService.createCompensation(id, damageDescription, damagePercentage, claimedAmount);
        } else {
            compensation.setDamageDescription(damageDescription);
            compensation.setDamagePercentage(damagePercentage);
            compensation.setClaimedAmount(claimedAmount);
            compensationService.assess(compensation.getId(), 2L, "质控李四", 
                    claimedAmount.multiply(damagePercentage).divide(new BigDecimal("100")), "评估完成");
        }
        
        Waybill waybill = waybillService.findById(id).get();
        waybill.setStatus(WaybillStatus.COMPENSATION_PENDING);
        waybillService.save(waybill);
        
        redirectAttributes.addFlashAttribute("success", "货损评估已提交");
        return "redirect:/waybills/" + id;
    }
}