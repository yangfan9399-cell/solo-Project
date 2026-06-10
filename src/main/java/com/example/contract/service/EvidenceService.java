package com.example.contract.service;

import com.example.contract.entity.Contract;
import com.example.contract.entity.ContractHistory;
import com.example.contract.entity.EvidenceChain;
import com.example.contract.entity.SigningRecord;
import com.example.contract.enums.ContractStatus;
import com.example.contract.repository.ContractHistoryRepository;
import com.example.contract.repository.ContractRepository;
import com.example.contract.repository.EvidenceChainRepository;
import com.example.contract.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EvidenceService {

    private final EvidenceChainRepository evidenceChainRepository;
    private final ContractRepository contractRepository;
    private final ContractHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public EvidenceChain createEvidence(Long contractId, Long recordId, String evidenceType, 
                                        String evidenceContent, Long operatorId) {
        EvidenceChain evidence = new EvidenceChain();
        evidence.setContractId(contractId);
        evidence.setRecordId(recordId);
        evidence.setEvidenceType(evidenceType);
        evidence.setEvidenceContent(evidenceContent);
        evidence.setHashValue(generateHash(evidenceContent));
        evidence.setOperatorId(operatorId);
        
        EvidenceChain saved = evidenceChainRepository.save(evidence);

        userRepository.findById(operatorId).ifPresent(operator -> {
            addHistory(contractId, operatorId, operator.getRealName(), "EVIDENCE_ADD", 
                "新增证据: " + evidenceType);
        });

        return saved;
    }

    @Transactional
    public void preserveEvidence(Long contractId, Long operatorId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("合同不存在"));

        contract.setStatus(ContractStatus.EVIDENCE_PRESERVED);
        contractRepository.save(contract);

        EvidenceChain evidence = new EvidenceChain();
        evidence.setContractId(contractId);
        evidence.setEvidenceType("CONTRACT_PRESERVATION");
        evidence.setEvidenceContent("合同证据保全完成，状态: " + contract.getStatus().getDescription());
        evidence.setHashValue(generateHash(contract.toString()));
        evidence.setOperatorId(operatorId);
        evidenceChainRepository.save(evidence);

        userRepository.findById(operatorId).ifPresent(operator -> {
            addHistory(contractId, operatorId, operator.getRealName(), "EVIDENCE_PRESERVE", "证据保全完成");
        });
    }

    public List<EvidenceChain> getEvidenceByContractId(Long contractId) {
        return evidenceChainRepository.findByContractIdOrderByCreatedAtDesc(contractId);
    }

    private String generateHash(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    private void addHistory(Long contractId, Long operatorId, String operatorName, String action, String description) {
        ContractHistory history = new ContractHistory();
        history.setContractId(contractId);
        history.setOperatorId(operatorId);
        history.setOperatorName(operatorName);
        history.setAction(action);
        history.setDescription(description);
        historyRepository.save(history);
    }
}