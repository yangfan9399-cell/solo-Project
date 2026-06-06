package com.manufacturing.fixture.controller;

import com.manufacturing.fixture.entity.CalibrationRecord;
import com.manufacturing.fixture.entity.CalibrationResult;
import com.manufacturing.fixture.entity.Fixture;
import com.manufacturing.fixture.service.CalibrationService;
import com.manufacturing.fixture.service.FixtureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/calibration")
@RequiredArgsConstructor
public class CalibrationController {

    private final CalibrationService calibrationService;
    private final FixtureService fixtureService;

    @GetMapping
    public String list(Model model) {
        List<CalibrationRecord> records = calibrationService.findAll();
        List<Fixture> expiredFixtures = calibrationService.getExpiredCalibrationFixtures();
        List<Fixture> warningFixtures = calibrationService.getWarningCalibrationFixtures();

        model.addAttribute("records", records);
        model.addAttribute("expiredFixtures", expiredFixtures);
        model.addAttribute("warningFixtures", warningFixtures);
        return "calibration/list";
    }

    @GetMapping("/add")
    public String addForm(@RequestParam(required = false) Long fixtureId, Model model) {
        List<Fixture> fixtures = fixtureService.findAll();
        model.addAttribute("fixtures", fixtures);
        model.addAttribute("selectedFixtureId", fixtureId);
        model.addAttribute("results", CalibrationResult.values());
        model.addAttribute("today", LocalDate.now());
        model.addAttribute("nextYear", LocalDate.now().plusYears(1));
        return "calibration/form";
    }

    @PostMapping("/add")
    public String addRecord(@RequestParam Long fixtureId,
                            @RequestParam LocalDate calibrationDate,
                            @RequestParam(required = false) String calibrationAgency,
                            @RequestParam(required = false) String certificateNo,
                            @RequestParam CalibrationResult result,
                            @RequestParam LocalDate nextCalibrationDate,
                            @RequestParam(required = false) String calibrator,
                            @RequestParam(required = false) String remark,
                            RedirectAttributes redirectAttributes) {
        try {
            CalibrationRecord record = calibrationService.addCalibrationRecord(
                    fixtureId, calibrationDate, calibrationAgency, certificateNo,
                    result, nextCalibrationDate, calibrator, remark);
            redirectAttributes.addFlashAttribute("success", "校准记录添加成功");
            return "redirect:/fixtures/" + fixtureId;
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "校准记录添加失败：" + e.getMessage());
            return "redirect:/calibration/add";
        }
    }

    @GetMapping("/expired")
    public String expiredList(Model model) {
        List<Fixture> expiredFixtures = calibrationService.getExpiredCalibrationFixtures();
        model.addAttribute("expiredFixtures", expiredFixtures);
        return "calibration/expired";
    }

    @GetMapping("/warning")
    public String warningList(Model model) {
        List<Fixture> warningFixtures = calibrationService.getWarningCalibrationFixtures();
        model.addAttribute("warningFixtures", warningFixtures);
        return "calibration/warning";
    }
}
