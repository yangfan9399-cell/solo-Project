package com.insurance.claim.service;

import com.insurance.claim.entity.*;
import com.insurance.claim.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ClaimCaseService {

    private final ClaimCaseRepository claimCaseRepository;
    private final AccidentInfoRepository accidentInfoRepository;
    private final PolicyRepository policyRepository;
    private final ClaimHistoryRepository historyRepository;
    private final RelatedClaimRepository relatedClaimRepository;
    private final SysUserRepository sysUserRepository;

    @Transactional
    public ClaimCase registerCase(ClaimCase claimCase, AccidentInfo accidentInfo, Long handlerId) {
        String caseNo = generateCaseNo();
        claimCase.setCaseNo(caseNo);
        claimCase.setStatus("REGISTERED");
        claimCase.setHandlerId(handlerId);

        Policy policy = policyRepository.findById(claimCase.getPolicyId())
                .orElseThrow(() -> new RuntimeException("保单不存在"));
        claimCase.setAccidentType(claimCase.getAccidentType());

        ClaimCase saved = claimCaseRepository.save(claimCase);

        accidentInfo.setClaimCaseId(saved.getId());
        accidentInfoRepository.save(accidentInfo);

        checkDuplicateAndFreeze(saved);

        addHistory(saved.getId(), "REGISTER", handlerId,
                sysUserRepository.findById(handlerId).map(SysUser::getRealName).orElse("经办人"),
                "案件登记完成，案件号：" + caseNo);

        return saved;
    }

    private String generateCaseNo() {
        String prefix = "CL" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = claimCaseRepository.count() + 1;
        return prefix + String.format("%04d", count);
    }

    @Transactional
    public void checkDuplicateAndFreeze(ClaimCase newCase) {
        List<ClaimCase> potentialDuplicates = claimCaseRepository
                .findPotentialDuplicates(newCase.getPolicyId(), newCase.getAccidentDate(), newCase.getId());

        if (!potentialDuplicates.isEmpty()) {
            newCase.setIsDuplicate(true);
            newCase.setFrozen(true);
            newCase.setFreezeReason("疑似重复报案，需人工核实");
            claimCaseRepository.save(newCase);

            for (ClaimCase existCase : potentialDuplicates) {
                if (!existCase.getFrozen()) {
                    existCase.setFrozen(true);
                    existCase.setIsDuplicate(true);
                    existCase.setFreezeReason("存在关联报案，需人工核实");
                    claimCaseRepository.save(existCase);
                    addHistory(existCase.getId(), "FREEZE", null, "系统",
                            "检测到关联报案，案件已冻结");
                }

                RelatedClaim related = new RelatedClaim();
                related.setMainCaseId(newCase.getId());
                related.setRelatedCaseId(existCase.getId());
                related.setRelationType("DUPLICATE");
                relatedClaimRepository.save(related);

                RelatedClaim related2 = new RelatedClaim();
                related2.setMainCaseId(existCase.getId());
                related2.setRelatedCaseId(newCase.getId());
                related2.setRelationType("DUPLICATE");
                relatedClaimRepository.save(related2);
            }

            addHistory(newCase.getId(), "FREEZE", null, "系统",
                    "检测到重复报案，案件已冻结，关联案件数：" + potentialDuplicates.size());
        }
    }

    @Transactional
    public void unfreezeCase(Long caseId, Long operatorId, String operatorName) {
        ClaimCase claimCase = claimCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("案件不存在"));
        claimCase.setFrozen(false);
        claimCase.setFreezeReason(null);
        claimCaseRepository.save(claimCase);

        addHistory(caseId, "UNFREEZE", operatorId, operatorName, "解除冻结，案件可继续处理");
    }

    public ClaimCase getCaseById(Long id) {
        return claimCaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("案件不存在"));
    }

    public List<ClaimCase> getAllCases() {
        return claimCaseRepository.findAll(Sort.by(Sort.Direction.DESC, "registerTime"));
    }

    public List<ClaimCase> getCasesByStatus(String status) {
        return claimCaseRepository.findByStatusOrderByRegisterTimeDesc(status);
    }

    public AccidentInfo getAccidentInfo(Long caseId) {
        return accidentInfoRepository.findByClaimCaseId(caseId).orElse(null);
    }

    public Policy getPolicyByCaseId(Long caseId) {
        ClaimCase claimCase = getCaseById(caseId);
        return policyRepository.findById(claimCase.getPolicyId()).orElse(null);
    }

    public List<ClaimCase> getRelatedCases(Long caseId) {
        List<RelatedClaim> relatedClaims = relatedClaimRepository.findByCaseId(caseId);
        List<ClaimCase> relatedCases = new ArrayList<>();
        for (RelatedClaim rc : relatedClaims) {
            Long relatedId = rc.getMainCaseId().equals(caseId) ? rc.getRelatedCaseId() : rc.getMainCaseId();
            claimCaseRepository.findById(relatedId).ifPresent(relatedCases::add);
        }
        return relatedCases;
    }

    @Transactional
    public void addHistory(Long caseId, String operationType, Long operatorId, String operatorName, String remark) {
        ClaimHistory history = new ClaimHistory();
        history.setClaimCaseId(caseId);
        history.setOperationType(operationType);
        history.setOperatorId(operatorId);
        history.setOperatorName(operatorName);
        history.setRemark(remark);
        historyRepository.save(history);
    }

    public List<ClaimHistory> getHistory(Long caseId) {
        return historyRepository.findByClaimCaseIdOrderByOperationTimeAsc(caseId);
    }

    @Transactional
    public void submitToReview(Long caseId, Long handlerId, String handlerName) {
        ClaimCase claimCase = getCaseById(caseId);
        if (claimCase.getFrozen()) {
            throw new RuntimeException("案件已冻结，无法提交核赔");
        }
        claimCase.setStatus("PENDING_REVIEW");
        claimCaseRepository.save(claimCase);
        addHistory(caseId, "SUBMIT_REVIEW", handlerId, handlerName, "提交核赔");
    }
}
