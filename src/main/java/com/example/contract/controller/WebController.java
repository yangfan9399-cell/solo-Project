package com.example.contract.controller;

import com.example.contract.entity.*;
import com.example.contract.enums.AuthMethod;
import com.example.contract.enums.ContractStatus;
import com.example.contract.enums.FailureReason;
import com.example.contract.repository.ContractHistoryRepository;
import com.example.contract.repository.SigningRecordRepository;
import com.example.contract.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WebController {

    private final ContractService contractService;
    private final LegalReviewService legalReviewService;
    private final EvidenceService evidenceService;
    private final StatisticsService statisticsService;
    private final UserService userService;
    private final SigningRecordRepository signingRecordRepository;
    private final ContractHistoryRepository historyRepository;

    @GetMapping("/")
    public String index(Model model) {
        List<Contract> contracts = contractService.getAllContracts();
        model.addAttribute("contracts", contracts);
        return "index";
    }

    @GetMapping("/contract/list")
    public String contractList(Model model) {
        List<Contract> contracts = contractService.getAllContracts();
        model.addAttribute("contracts", contracts);
        return "contract/list";
    }

    @GetMapping("/contract/create")
    public String createContract(Model model) {
        List<User> operators = userService.getUsersByRole(com.example.contract.enums.UserRole.OPERATOR);
        model.addAttribute("operators", operators);
        return "contract/create";
    }

    @PostMapping("/contract/create")
    public String submitContract(@RequestParam String title, @RequestParam String contractType,
                                @RequestParam String signingParty, @RequestParam String signerName,
                                @RequestParam String signerPhone, @RequestParam Long operatorId,
                                @RequestParam(required = false) String content) {
        Contract contract = new Contract();
        contract.setTitle(title);
        contract.setContractType(contractType);
        contract.setSigningParty(signingParty);
        contract.setSignerName(signerName);
        contract.setSignerPhone(signerPhone);
        contract.setOperatorId(operatorId);
        contract.setContent(content != null ? content : "合同内容...");
        contractService.createContract(contract);
        return "redirect:/contract/list";
    }

    @GetMapping("/contract/{id}")
    public String contractDetail(@PathVariable Long id, Model model) {
        Contract contract = contractService.getContractById(id)
                .orElseThrow(() -> new RuntimeException("合同不存在"));
        
        List<SigningRecord> records = signingRecordRepository.findByContractIdOrderByCreatedAtDesc(id);
        List<EvidenceChain> evidences = evidenceService.getEvidenceByContractId(id);
        List<ContractHistory> histories = historyRepository.findByContractIdOrderByCreatedAtDesc(id);
        LegalReview review = legalReviewService.getReviewByContractId(id);
        User operator = userService.getUserById(contract.getOperatorId()).orElse(null);
        
        model.addAttribute("contract", contract);
        model.addAttribute("records", records);
        model.addAttribute("evidences", evidences);
        model.addAttribute("histories", histories);
        model.addAttribute("review", review);
        model.addAttribute("operator", operator);
        
        Map<String, String> statusMap = new HashMap<>();
        statusMap.put("DRAFT", "草稿");
        statusMap.put("PENDING", "待签署");
        statusMap.put("SIGNED", "已签署");
        statusMap.put("FAILED", "签署失败");
        statusMap.put("REVOKED", "已撤回");
        statusMap.put("EVIDENCE_PRESERVED", "证据已保全");
        model.addAttribute("statusMap", statusMap);
        
        return "contract/detail";
    }

    @PostMapping("/contract/{id}/retry")
    public String retrySigning(@PathVariable Long id) {
        contractService.retrySigning(id, 2L);
        return "redirect:/contract/" + id;
    }

    @PostMapping("/contract/{id}/complete")
    public String completeSigning(@PathVariable Long id, @RequestParam String authMethod) {
        contractService.completeSigning(id, 2L, AuthMethod.valueOf(authMethod));
        return "redirect:/contract/" + id;
    }

    @PostMapping("/contract/{id}/revoke")
    public String revokeContract(@PathVariable Long id, @RequestParam String authMethod) {
        contractService.revokeContract(id, 1L, AuthMethod.valueOf(authMethod));
        return "redirect:/contract/" + id;
    }

    @PostMapping("/contract/{id}/unfreeze")
    public String unfreezeContract(@PathVariable Long id) {
        contractService.unfreezeContract(id, 1L);
        return "redirect:/contract/" + id;
    }

    @PostMapping("/contract/{id}/reauth")
    public String reAuthenticate(@PathVariable Long id, @RequestParam String authMethod) {
        contractService.reAuthenticate(id, 2L, AuthMethod.valueOf(authMethod));
        return "redirect:/contract/" + id;
    }

    @GetMapping("/legal/review")
    public String legalReviewList(Model model) {
        List<LegalReview> reviews = legalReviewService.getReviewsByStatus("PENDING");
        model.addAttribute("reviews", reviews);
        return "legal/review";
    }

    @PostMapping("/legal/{reviewId}/approve")
    public String approveReview(@PathVariable Long reviewId, @RequestParam(required = false) String comment) {
        legalReviewService.completeReview(reviewId, "REVIEW_APPROVE", comment);
        return "redirect:/legal/review";
    }

    @PostMapping("/legal/{reviewId}/reject")
    public String rejectReview(@PathVariable Long reviewId, @RequestParam String comment) {
        legalReviewService.completeReview(reviewId, "REVIEW_REJECT", comment);
        return "redirect:/legal/review";
    }

    @GetMapping("/evidence/list")
    public String evidenceList(Model model) {
        List<Contract> contracts = contractService.getAllContracts();
        model.addAttribute("contracts", contracts);
        return "evidence/list";
    }

    @PostMapping("/evidence/{contractId}/preserve")
    public String preserveEvidence(@PathVariable Long contractId) {
        evidenceService.preserveEvidence(contractId, 4L);
        return "redirect:/contract/" + contractId;
    }

    @GetMapping("/statistics")
    public String statistics(Model model) {
        model.addAttribute("overall", statisticsService.getOverallStatistics());
        model.addAttribute("department", statisticsService.getDepartmentStatistics());
        model.addAttribute("contractType", statisticsService.getContractTypeStatistics());
        model.addAttribute("failureReason", statisticsService.getFailureReasonStatistics());
        model.addAttribute("retryDuration", statisticsService.getRetryDurationStatistics());
        return "statistics/index";
    }

    @GetMapping("/samples")
    public String showSamples(Model model) {
        List<Contract> contracts = contractService.getAllContracts();
        model.addAttribute("contracts", contracts);
        return "samples/index";
    }
}