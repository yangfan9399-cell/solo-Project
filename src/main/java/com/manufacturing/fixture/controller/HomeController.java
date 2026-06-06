package com.manufacturing.fixture.controller;

import com.manufacturing.fixture.entity.*;
import com.manufacturing.fixture.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class HomeController {

    private final FixtureService fixtureService;
    private final BorrowService borrowService;
    private final CalibrationService calibrationService;
    private final AnalysisService analysisService;

    @GetMapping("/")
    public String index(Model model) {
        borrowService.updateOverdueStatus();

        model.addAttribute("totalFixtures", fixtureService.count());
        model.addAttribute("availableFixtures", fixtureService.findByStatus(FixtureStatus.AVAILABLE).size());
        model.addAttribute("borrowedFixtures", fixtureService.findByStatus(FixtureStatus.BORROWED).size());
        model.addAttribute("maintenanceFixtures", fixtureService.findByStatus(FixtureStatus.IN_MAINTENANCE).size());
        model.addAttribute("scrappedFixtures", fixtureService.findByStatus(FixtureStatus.SCRAPPED).size());

        List<Fixture> expiredFixtures = calibrationService.getExpiredCalibrationFixtures();
        List<Fixture> warningFixtures = calibrationService.getWarningCalibrationFixtures();
        List<BorrowRecord> overdueBorrows = borrowService.findOverdueBorrows();

        model.addAttribute("expiredCalibrationCount", expiredFixtures.size());
        model.addAttribute("warningCalibrationCount", warningFixtures.size());
        model.addAttribute("overdueBorrowCount", overdueBorrows.size());

        model.addAttribute("fixtureTypeStats", fixtureService.countByFixtureType());
        model.addAttribute("fixtureStatusStats", fixtureService.countByStatus());

        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = LocalDateTime.now();
        model.addAttribute("monthlyStats", analysisService.getAnalysisByExceptionCause(startOfMonth, endOfMonth));

        return "index";
    }
}
