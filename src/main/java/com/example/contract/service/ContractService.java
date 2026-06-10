package com.example.contract.service;

import com.example.contract.entity.Contract;
import com.example.contract.entity.ContractHistory;
import com.example.contract.entity.SigningRecord;
import com.example.contract.enums.AuthMethod;
import com.example.contract.enums.ContractStatus;
import com.example.contract.enums.FailureReason;
import com.example.contract.repository.ContractHistoryRepository;
import com.example.contract.repository.ContractRepository;
import com.example.contract.repository.SigningRecordRepository;
import com.example.contract.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final SigningRecordRepository signingRecordRepository;
    private final ContractHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public Contract createContract(Contract contract) {
        contract.setContractNo(generateContractNo());
        contract.setStatus(ContractStatus.PENDING);
        Contract saved = contractRepository.save(contract);
        
        userRepository.findById(contract.getOperatorId()).ifPresent(operator -> {
            addHistory(saved.getId(), contract.getOperatorId(), operator.getRealName(), "CREATE", "创建合同");
        });
        
        return saved;
    }

    public Optional<Contract> getContractById(Long id) {
        return contractRepository.findById(id);
    }

    public List<Contract> getAllContracts() {
        return contractRepository.findAll();
    }

    public List<Contract> getContractsByStatus(ContractStatus status) {
        return contractRepository.findByStatus(status);
    }

    public List<Contract> getFailedContracts() {
        return contractRepository.findFailedContracts();
    }

    @Transactional
    public void handleSigningFailure(Long contractId, Long signerId, FailureReason reason, String detail) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("合同不存在"));

        SigningRecord record = new SigningRecord();
        record.setContractId(contractId);
        record.setSignerId(signerId);
        record.setAuthSuccess(false);
        record.setFailureReason(reason);
        record.setFailureDetail(detail);
        
        Integer retryCount = signingRecordRepository.countByContractId(contractId);
        record.setRetryCount(retryCount);
        signingRecordRepository.save(record);

        contract.setStatus(ContractStatus.FAILED);
        contractRepository.save(contract);

        userRepository.findById(signerId).ifPresent(signer -> {
            addHistory(contractId, signerId, signer.getRealName(), "SIGN_FAILED", 
                "签署失败: " + reason.getDescription() + (detail != null ? " - " + detail : ""));
        });

        if (reason == FailureReason.IDENTITY_MISMATCH) {
            contract.setIsFrozen(true);
            contractRepository.save(contract);
            addHistory(contractId, signerId, "系统", "FREEZE", "身份不符，合同已冻结");
        }
    }

    @Transactional
    public void retrySigning(Long contractId, Long signerId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("合同不存在"));

        if (Boolean.TRUE.equals(contract.getIsFrozen())) {
            throw new RuntimeException("合同已冻结，请先完成身份重新认证");
        }

        contract.setStatus(ContractStatus.PENDING);
        contractRepository.save(contract);
        
        userRepository.findById(signerId).ifPresent(signer -> {
            addHistory(contractId, signerId, signer.getRealName(), "RETRY", "申请补签");
        });
    }

    @Transactional
    public void completeSigning(Long contractId, Long signerId, AuthMethod authMethod) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("合同不存在"));

        SigningRecord record = new SigningRecord();
        record.setContractId(contractId);
        record.setSignerId(signerId);
        record.setAuthMethod(authMethod);
        record.setAuthSuccess(true);
        record.setSigningTime(LocalDateTime.now());
        signingRecordRepository.save(record);

        contract.setStatus(ContractStatus.SIGNED);
        contract.setSignedAt(LocalDateTime.now());
        contract.setIsFrozen(false);
        contractRepository.save(contract);

        userRepository.findById(signerId).ifPresent(signer -> {
            addHistory(contractId, signerId, signer.getRealName(), "SIGNED", "签署成功");
        });
    }

    @Transactional
    public void revokeContract(Long contractId, Long operatorId, AuthMethod authMethod) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("合同不存在"));

        contract.setStatus(ContractStatus.REVOKED);
        contractRepository.save(contract);

        SigningRecord record = new SigningRecord();
        record.setContractId(contractId);
        record.setSignerId(operatorId);
        record.setAuthMethod(authMethod);
        record.setAuthSuccess(false);
        record.setFailureReason(FailureReason.CONTRACT_REVOKED);
        signingRecordRepository.save(record);

        userRepository.findById(operatorId).ifPresent(operator -> {
            addHistory(contractId, operatorId, operator.getRealName(), "REVOKE", "合同已撤回");
        });
    }

    @Transactional
    public void unfreezeContract(Long contractId, Long operatorId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("合同不存在"));

        contract.setIsFrozen(false);
        contract.setStatus(ContractStatus.PENDING);
        contractRepository.save(contract);

        userRepository.findById(operatorId).ifPresent(operator -> {
            addHistory(contractId, operatorId, operator.getRealName(), "UNFREEZE", "合同已解冻，允许重新认证");
        });
    }

    @Transactional
    public void reAuthenticate(Long contractId, Long signerId, AuthMethod authMethod) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("合同不存在"));

        if (Boolean.TRUE.equals(contract.getIsFrozen())) {
            throw new RuntimeException("合同已冻结，无法进行重新认证");
        }

        SigningRecord record = new SigningRecord();
        record.setContractId(contractId);
        record.setSignerId(signerId);
        record.setAuthMethod(authMethod);
        record.setAuthSuccess(true);
        record.setSigningTime(LocalDateTime.now());
        record.setRetryCount(signingRecordRepository.countByContractId(contractId));
        signingRecordRepository.save(record);

        contract.setStatus(ContractStatus.SIGNED);
        contract.setSignedAt(LocalDateTime.now());
        contract.setIsFrozen(false);
        contractRepository.save(contract);

        userRepository.findById(signerId).ifPresent(signer -> {
            addHistory(contractId, signerId, signer.getRealName(), "RE_AUTH_SUCCESS", "身份重新认证成功，签署完成");
        });
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

    private String generateContractNo() {
        return "HT" + LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) 
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}