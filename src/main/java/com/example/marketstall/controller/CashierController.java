package com.example.marketstall.controller;

import com.example.marketstall.dto.StallDetailDTO;
import com.example.marketstall.entity.PaymentRecord;
import com.example.marketstall.entity.Stall;
import com.example.marketstall.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/cashier")
@RequiredArgsConstructor
public class CashierController {

    private final PaymentRecordService paymentRecordService;
    private final StallService stallService;
    private final HistoryNodeService historyNodeService;

    @GetMapping("/payments")
    public String listPayments(Model model) {
        model.addAttribute("payments", paymentRecordService.getAllPaymentRecords());
        return "cashier/payments";
    }

    @GetMapping("/payments/pending")
    public String listPendingPayments(Model model) {
        model.addAttribute("payments", paymentRecordService.getPendingPayments());
        return "cashier/payments-pending";
    }

    @GetMapping("/payments/new")
    public String newPayment(Model model) {
        model.addAttribute("payment", new PaymentRecord());
        model.addAttribute("stalls", stallService.getAllStalls());
        return "cashier/payment-form";
    }

    @PostMapping("/payments")
    public String savePayment(@ModelAttribute PaymentRecord payment) {
        paymentRecordService.savePaymentRecord(payment);
        return "redirect:/cashier/payments";
    }

    @GetMapping("/payments/{id}/confirm")
    public String confirmPayment(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String operator = auth.getName();
        
        PaymentRecord payment = paymentRecordService.getPaymentRecordById(id);
        paymentRecordService.confirmPayment(id, operator);
        
        historyNodeService.addNode(payment.getStallId(), "PAYMENT", "租金缴费确认，金额: " + payment.getAmount(), operator);
        
        return "redirect:/cashier/payments";
    }

    @GetMapping("/stalls/{id}/payment")
    public String paymentForStall(@PathVariable Long id, Model model) {
        StallDetailDTO detail = stallService.getStallDetail(id);
        model.addAttribute("detail", detail);
        model.addAttribute("payment", new PaymentRecord());
        return "cashier/stall-payment";
    }

    @PostMapping("/stalls/{id}/payment")
    public String processPayment(@PathVariable Long id, @ModelAttribute PaymentRecord payment) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String operator = auth.getName();
        
        payment.setStallId(id);
        payment.setPaymentDate(LocalDate.now());
        payment.setStatus("confirmed");
        payment.setOperator(operator);
        paymentRecordService.savePaymentRecord(payment);
        
        historyNodeService.addNode(id, "PAYMENT", "租金缴费，金额: " + payment.getAmount(), operator);
        
        return "redirect:/cashier/stalls/" + id;
    }

    @GetMapping("/stalls")
    public String listStalls(Model model) {
        model.addAttribute("stalls", stallService.getAllStalls());
        return "cashier/stalls";
    }

    @GetMapping("/stalls/{id}")
    public String stallDetail(@PathVariable Long id, Model model) {
        StallDetailDTO detail = stallService.getStallDetail(id);
        model.addAttribute("detail", detail);
        return "cashier/stall-detail";
    }
}