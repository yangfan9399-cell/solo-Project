package com.manufacturing.fixture.controller;

import com.manufacturing.fixture.entity.BorrowRecord;
import com.manufacturing.fixture.entity.DamageRecord;
import com.manufacturing.fixture.entity.Fixture;
import com.manufacturing.fixture.entity.FixtureStatus;
import com.manufacturing.fixture.service.BorrowService;
import com.manufacturing.fixture.service.CalibrationService;
import com.manufacturing.fixture.service.DamageService;
import com.manufacturing.fixture.service.FixtureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/fixtures")
@RequiredArgsConstructor
public class FixtureController {

    private final FixtureService fixtureService;
    private final BorrowService borrowService;
    private final CalibrationService calibrationService;
    private final DamageService damageService;

    @GetMapping
    public String list(@RequestParam(required = false) String status,
                       @RequestParam(required = false) String type,
                       Model model) {
        List<Fixture> fixtures;
        if (status != null && !status.isEmpty()) {
            fixtures = fixtureService.findByStatus(FixtureStatus.valueOf(status));
        } else {
            fixtures = fixtureService.findAll();
        }

        model.addAttribute("fixtures", fixtures);
        model.addAttribute("statuses", FixtureStatus.values());
        model.addAttribute("selectedStatus", status);
        model.addAttribute("selectedType", type);

        return "fixtures/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        Fixture fixture = fixtureService.findById(id)
                .orElseThrow(() -> new RuntimeException("夹具不存在"));

        List<BorrowRecord> borrowRecords = borrowService.findByFixtureId(id);
        List<DamageRecord> damageRecords = damageService.findByFixtureId(id);

        model.addAttribute("fixture", fixture);
        model.addAttribute("borrowRecords", borrowRecords);
        model.addAttribute("damageRecords", damageRecords);
        model.addAttribute("calibrationRecords", calibrationService.findByFixtureId(id));
        model.addAttribute("isCalibrationExpired", fixture.isCalibrationExpired());
        model.addAttribute("isCalibrationWarning", fixture.isCalibrationWarning());

        return "fixtures/detail";
    }

    @GetMapping("/add")
    public String addForm(Model model) {
        model.addAttribute("fixture", new Fixture());
        model.addAttribute("statuses", FixtureStatus.values());
        return "fixtures/form";
    }

    @PostMapping
    public String save(@ModelAttribute Fixture fixture, RedirectAttributes redirectAttributes) {
        try {
            fixtureService.save(fixture);
            redirectAttributes.addFlashAttribute("success", "夹具添加成功");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "夹具添加失败：" + e.getMessage());
        }
        return "redirect:/fixtures";
    }

    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable Long id, Model model) {
        Fixture fixture = fixtureService.findById(id)
                .orElseThrow(() -> new RuntimeException("夹具不存在"));
        model.addAttribute("fixture", fixture);
        model.addAttribute("statuses", FixtureStatus.values());
        return "fixtures/form";
    }

    @PostMapping("/{id}/edit")
    public String update(@PathVariable Long id, @ModelAttribute Fixture fixture, RedirectAttributes redirectAttributes) {
        try {
            Fixture existing = fixtureService.findById(id)
                    .orElseThrow(() -> new RuntimeException("夹具不存在"));

            existing.setFixtureNo(fixture.getFixtureNo());
            existing.setFixtureName(fixture.getFixtureName());
            existing.setFixtureType(fixture.getFixtureType());
            existing.setApplicableProcess(fixture.getApplicableProcess());
            existing.setStatus(fixture.getStatus());
            existing.setLocation(fixture.getLocation());
            existing.setResponsiblePerson(fixture.getResponsiblePerson());
            existing.setCalibrationCertificate(fixture.getCalibrationCertificate());
            existing.setLastCalibrationDate(fixture.getLastCalibrationDate());
            existing.setNextCalibrationDate(fixture.getNextCalibrationDate());
            existing.setDescription(fixture.getDescription());

            fixtureService.save(existing);
            redirectAttributes.addFlashAttribute("success", "夹具更新成功");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "夹具更新失败：" + e.getMessage());
        }
        return "redirect:/fixtures/" + id;
    }

    @PostMapping("/{id}/send-calibration")
    public String sendForCalibration(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            calibrationService.sendForCalibration(id);
            redirectAttributes.addFlashAttribute("success", "已发送校准申请");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "送检失败：" + e.getMessage());
        }
        return "redirect:/fixtures/" + id;
    }

    @GetMapping("/calibration-expired")
    public String expiredCalibration(Model model) {
        List<Fixture> expiredFixtures = fixtureService.findExpiredCalibration();
        List<Fixture> warningFixtures = fixtureService.findCalibrationWarning();

        model.addAttribute("expiredFixtures", expiredFixtures);
        model.addAttribute("warningFixtures", warningFixtures);
        return "fixtures/calibration-expired";
    }
}
