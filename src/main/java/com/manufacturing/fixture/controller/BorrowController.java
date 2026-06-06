package com.manufacturing.fixture.controller;

import com.manufacturing.fixture.entity.BorrowRecord;
import com.manufacturing.fixture.entity.BorrowStatus;
import com.manufacturing.fixture.entity.Fixture;
import com.manufacturing.fixture.entity.QualityResult;
import com.manufacturing.fixture.service.BorrowService;
import com.manufacturing.fixture.service.FixtureService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/borrows")
@RequiredArgsConstructor
public class BorrowController {

    private final BorrowService borrowService;
    private final FixtureService fixtureService;

    @GetMapping
    public String list(@RequestParam(required = false) String status,
                       @RequestParam(required = false) String productionLine,
                       Model model) {
        borrowService.updateOverdueStatus();

        List<BorrowRecord> borrows;
        if (status != null && !status.isEmpty()) {
            borrows = borrowService.findByStatus(BorrowStatus.valueOf(status));
        } else {
            borrows = borrowService.findAll();
        }

        model.addAttribute("borrows", borrows);
        model.addAttribute("statuses", BorrowStatus.values());
        model.addAttribute("selectedStatus", status);
        model.addAttribute("selectedProductionLine", productionLine);

        return "borrows/list";
    }

    @GetMapping("/{id}")
    public String detail(@PathVariable Long id, Model model) {
        BorrowRecord borrow = borrowService.findById(id)
                .orElseThrow(() -> new RuntimeException("借用记录不存在"));
        model.addAttribute("borrow", borrow);
        return "borrows/detail";
    }

    @GetMapping("/apply")
    public String applyForm(@RequestParam(required = false) Long fixtureId, Model model) {
        List<Fixture> availableFixtures = fixtureService.findAvailableFixtures();
        model.addAttribute("availableFixtures", availableFixtures);
        model.addAttribute("selectedFixtureId", fixtureId);
        model.addAttribute("defaultReturnDate", LocalDate.now().plusDays(7));
        return "borrows/apply";
    }

    @PostMapping("/apply")
    public String applyBorrow(@RequestParam Long fixtureId,
                              @RequestParam String applicant,
                              @RequestParam String productionLine,
                              @RequestParam(required = false) String purpose,
                              @RequestParam LocalDate expectedReturnDate,
                              RedirectAttributes redirectAttributes) {
        try {
            BorrowRecord record = borrowService.applyBorrow(fixtureId, applicant, productionLine, purpose, expectedReturnDate);
            redirectAttributes.addFlashAttribute("success", "借用申请提交成功");
            return "redirect:/borrows/" + record.getId();
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "借用申请失败：" + e.getMessage());
            return "redirect:/borrows/apply";
        }
    }

    @PostMapping("/{id}/confirm-outbound")
    public String confirmOutbound(@PathVariable Long id,
                                  @RequestParam String adminConfirmer,
                                  RedirectAttributes redirectAttributes) {
        try {
            borrowService.confirmOutbound(id, adminConfirmer);
            redirectAttributes.addFlashAttribute("success", "出库确认成功");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "出库确认失败：" + e.getMessage());
        }
        return "redirect:/borrows/" + id;
    }

    @GetMapping("/{id}/return")
    public String returnForm(@PathVariable Long id, Model model) {
        BorrowRecord borrow = borrowService.findById(id)
                .orElseThrow(() -> new RuntimeException("借用记录不存在"));
        model.addAttribute("borrow", borrow);
        return "borrows/return";
    }

    @PostMapping("/{id}/return")
    public String returnFixture(@PathVariable Long id,
                                @RequestParam(defaultValue = "false") boolean damaged,
                                @RequestParam(required = false) String damageDescription,
                                RedirectAttributes redirectAttributes) {
        try {
            borrowService.returnFixture(id, damaged, damageDescription);
            redirectAttributes.addFlashAttribute("success", "归还提交成功，等待质量复核");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "归还失败：" + e.getMessage());
        }
        return "redirect:/borrows/" + id;
    }

    @GetMapping("/{id}/quality-review")
    public String qualityReviewForm(@PathVariable Long id, Model model) {
        BorrowRecord borrow = borrowService.findById(id)
                .orElseThrow(() -> new RuntimeException("借用记录不存在"));
        model.addAttribute("borrow", borrow);
        model.addAttribute("qualityResults", QualityResult.values());
        return "borrows/quality-review";
    }

    @PostMapping("/{id}/quality-review")
    public String qualityReview(@PathVariable Long id,
                                @RequestParam String qualityReviewer,
                                @RequestParam QualityResult qualityResult,
                                @RequestParam(required = false) String qualityRemark,
                                RedirectAttributes redirectAttributes) {
        try {
            borrowService.qualityReview(id, qualityReviewer, qualityResult, qualityRemark);
            redirectAttributes.addFlashAttribute("success", "质量复核完成");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "质量复核失败：" + e.getMessage());
        }
        return "redirect:/borrows/" + id;
    }

    @PostMapping("/{id}/cancel")
    public String cancelBorrow(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            borrowService.cancelBorrow(id);
            redirectAttributes.addFlashAttribute("success", "借用申请已取消");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "取消失败：" + e.getMessage());
        }
        return "redirect:/borrows/" + id;
    }

    @GetMapping("/overdue")
    public String overdueList(Model model) {
        borrowService.updateOverdueStatus();
        List<BorrowRecord> overdueBorrows = borrowService.findOverdueBorrows();
        model.addAttribute("overdueBorrows", overdueBorrows);
        return "borrows/overdue";
    }
}
