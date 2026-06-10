package com.example.contract.config;

import com.example.contract.entity.*;
import com.example.contract.enums.*;
import com.example.contract.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ContractRepository contractRepository;
    private final SigningRecordRepository signingRecordRepository;
    private final EvidenceChainRepository evidenceChainRepository;
    private final LegalReviewRepository legalReviewRepository;
    private final ContractHistoryRepository historyRepository;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            initUsers();
        }
        
        if (contractRepository.count() == 0) {
            initContracts();
        }
    }

    private void initUsers() {
        User operator = new User();
        operator.setUsername("operator");
        operator.setPassword("123456");
        operator.setRealName("张经理");
        operator.setPhone("13800138001");
        operator.setDepartment("业务部");
        operator.setRole(UserRole.OPERATOR);
        userRepository.save(operator);

        User signer = new User();
        signer.setUsername("signer");
        signer.setPassword("123456");
        signer.setRealName("李签署人");
        signer.setPhone("13800138002");
        signer.setDepartment("客户");
        signer.setRole(UserRole.SIGNER);
        userRepository.save(signer);

        User legal = new User();
        legal.setUsername("legal");
        legal.setPassword("123456");
        legal.setRealName("王法务");
        legal.setPhone("13800138003");
        legal.setDepartment("法务部");
        legal.setRole(UserRole.LEGAL);
        userRepository.save(legal);

        User archivist = new User();
        archivist.setUsername("archivist");
        archivist.setPassword("123456");
        archivist.setRealName("赵档案员");
        archivist.setPhone("13800138004");
        archivist.setDepartment("档案部");
        archivist.setRole(UserRole.ARCHIVIST);
        userRepository.save(archivist);

        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword("123456");
        admin.setRealName("管理员");
        admin.setPhone("13800138000");
        admin.setDepartment("管理部");
        admin.setRole(UserRole.ADMIN);
        userRepository.save(admin);
    }

    private void initContracts() {
        User operator = userRepository.findByUsername("operator").orElseThrow();
        User signer = userRepository.findByUsername("signer").orElseThrow();
        User legal = userRepository.findByUsername("legal").orElseThrow();
        User archivist = userRepository.findByUsername("archivist").orElseThrow();

        Contract normalContract = new Contract();
        normalContract.setContractNo("HT20240115NORMAL001");
        normalContract.setTitle("设备采购合同（正常签署）");
        normalContract.setContractType("采购合同");
        normalContract.setSigningParty("北京科技有限公司");
        normalContract.setSignerName("李签署人");
        normalContract.setSignerPhone("13800138002");
        normalContract.setStatus(ContractStatus.SIGNED);
        normalContract.setAmount(new BigDecimal("50000.00"));
        normalContract.setOperatorId(operator.getId());
        normalContract.setContent("甲方：北京科技有限公司\n乙方：供应商\n根据《中华人民共和国合同法》...");
        normalContract.setSignedAt(LocalDateTime.now().minusDays(5));
        contractRepository.save(normalContract);

        SigningRecord normalRecord = new SigningRecord();
        normalRecord.setContractId(normalContract.getId());
        normalRecord.setSignerId(signer.getId());
        normalRecord.setAuthMethod(AuthMethod.SMS);
        normalRecord.setAuthSuccess(true);
        normalRecord.setSigningTime(normalContract.getSignedAt());
        signingRecordRepository.save(normalRecord);

        addHistory(normalContract.getId(), operator.getId(), operator.getRealName(), "CREATE", "创建合同");
        addHistory(normalContract.getId(), signer.getId(), signer.getRealName(), "SIGNED", "签署成功");

        Contract smsFailedContract = new Contract();
        smsFailedContract.setContractNo("HT20240115SMSFAIL001");
        smsFailedContract.setTitle("服务外包合同（短信验证失败）");
        smsFailedContract.setContractType("服务合同");
        smsFailedContract.setSigningParty("上海服务有限公司");
        smsFailedContract.setSignerName("李签署人");
        smsFailedContract.setSignerPhone("13800138002");
        smsFailedContract.setStatus(ContractStatus.FAILED);
        smsFailedContract.setAmount(new BigDecimal("30000.00"));
        smsFailedContract.setOperatorId(operator.getId());
        smsFailedContract.setContent("甲方：上海服务有限公司\n乙方：服务方\n根据《中华人民共和国合同法》...");
        contractRepository.save(smsFailedContract);

        SigningRecord smsFailedRecord = new SigningRecord();
        smsFailedRecord.setContractId(smsFailedContract.getId());
        smsFailedRecord.setSignerId(signer.getId());
        smsFailedRecord.setAuthMethod(AuthMethod.SMS);
        smsFailedRecord.setAuthSuccess(false);
        smsFailedRecord.setFailureReason(FailureReason.SMS_VERIFICATION_FAILED);
        smsFailedRecord.setFailureDetail("验证码输入错误超过3次");
        smsFailedRecord.setRetryCount(0);
        signingRecordRepository.save(smsFailedRecord);

        addHistory(smsFailedContract.getId(), operator.getId(), operator.getRealName(), "CREATE", "创建合同");
        addHistory(smsFailedContract.getId(), signer.getId(), signer.getRealName(), "SIGN_FAILED", "签署失败: 短信验证失败 - 验证码输入错误超过3次");

        LegalReview smsReview = new LegalReview();
        smsReview.setContractId(smsFailedContract.getId());
        smsReview.setReviewerId(legal.getId());
        smsReview.setReviewStatus("PENDING");
        legalReviewRepository.save(smsReview);
        addHistory(smsFailedContract.getId(), legal.getId(), legal.getRealName(), "REVIEW_INIT", "法务复核已发起");

        Contract identityMismatchContract = new Contract();
        identityMismatchContract.setContractNo("HT20240115IDFAIL001");
        identityMismatchContract.setTitle("技术咨询合同（身份不符）");
        identityMismatchContract.setContractType("咨询合同");
        identityMismatchContract.setSigningParty("广州技术有限公司");
        identityMismatchContract.setSignerName("王XX");
        identityMismatchContract.setSignerPhone("13800138005");
        identityMismatchContract.setStatus(ContractStatus.FAILED);
        identityMismatchContract.setIsFrozen(true);
        identityMismatchContract.setAmount(new BigDecimal("80000.00"));
        identityMismatchContract.setOperatorId(operator.getId());
        identityMismatchContract.setContent("甲方：广州技术有限公司\n乙方：咨询方\n根据《中华人民共和国合同法》...");
        contractRepository.save(identityMismatchContract);

        SigningRecord identityRecord = new SigningRecord();
        identityRecord.setContractId(identityMismatchContract.getId());
        identityRecord.setSignerId(signer.getId());
        identityRecord.setAuthMethod(AuthMethod.ID_CARD);
        identityRecord.setAuthSuccess(false);
        identityRecord.setFailureReason(FailureReason.IDENTITY_MISMATCH);
        identityRecord.setFailureDetail("身份证信息与系统登记不符");
        identityRecord.setRetryCount(0);
        signingRecordRepository.save(identityRecord);

        addHistory(identityMismatchContract.getId(), operator.getId(), operator.getRealName(), "CREATE", "创建合同");
        addHistory(identityMismatchContract.getId(), signer.getId(), signer.getRealName(), "SIGN_FAILED", "签署失败: 签署人身份不符 - 身份证信息与系统登记不符");
        addHistory(identityMismatchContract.getId(), signer.getId(), "系统", "FREEZE", "身份不符，合同已冻结");

        LegalReview identityReview = new LegalReview();
        identityReview.setContractId(identityMismatchContract.getId());
        identityReview.setReviewerId(legal.getId());
        identityReview.setReviewStatus("REVIEW_REJECT");
        identityReview.setReviewComment("身份验证失败，需重新认证");
        identityReview.setReviewedAt(LocalDateTime.now().minusDays(1));
        legalReviewRepository.save(identityReview);
        addHistory(identityMismatchContract.getId(), legal.getId(), legal.getRealName(), "REVIEW_REJECT", "法务复核拒绝: 身份验证失败，需重新认证");

        Contract revokedContract = new Contract();
        revokedContract.setContractNo("HT20240115REVOKE001");
        revokedContract.setTitle("租赁合同（已撤回）");
        revokedContract.setContractType("租赁合同");
        revokedContract.setSigningParty("深圳租赁有限公司");
        revokedContract.setSignerName("李签署人");
        revokedContract.setSignerPhone("13800138002");
        revokedContract.setStatus(ContractStatus.REVOKED);
        revokedContract.setAmount(new BigDecimal("12000.00"));
        revokedContract.setOperatorId(operator.getId());
        revokedContract.setContent("甲方：深圳租赁有限公司\n乙方：承租方\n根据《中华人民共和国合同法》...");
        contractRepository.save(revokedContract);

        SigningRecord revokeRecord = new SigningRecord();
        revokeRecord.setContractId(revokedContract.getId());
        revokeRecord.setSignerId(operator.getId());
        revokeRecord.setAuthMethod(AuthMethod.SMS);
        revokeRecord.setAuthSuccess(false);
        revokeRecord.setFailureReason(FailureReason.CONTRACT_REVOKED);
        signingRecordRepository.save(revokeRecord);

        addHistory(revokedContract.getId(), operator.getId(), operator.getRealName(), "CREATE", "创建合同");
        addHistory(revokedContract.getId(), operator.getId(), operator.getRealName(), "REVOKE", "合同已撤回");

        Contract pendingContract = new Contract();
        pendingContract.setContractNo("HT20240115PENDING001");
        pendingContract.setTitle("软件开发合同（待签署）");
        pendingContract.setContractType("技术合同");
        pendingContract.setSigningParty("成都软件有限公司");
        pendingContract.setSignerName("李签署人");
        pendingContract.setSignerPhone("13800138002");
        pendingContract.setStatus(ContractStatus.PENDING);
        pendingContract.setAmount(new BigDecimal("100000.00"));
        pendingContract.setOperatorId(operator.getId());
        pendingContract.setContent("甲方：成都软件有限公司\n乙方：开发方\n根据《中华人民共和国合同法》...");
        contractRepository.save(pendingContract);

        addHistory(pendingContract.getId(), operator.getId(), operator.getRealName(), "CREATE", "创建合同");

        EvidenceChain evidence1 = new EvidenceChain();
        evidence1.setContractId(normalContract.getId());
        evidence1.setRecordId(normalRecord.getId());
        evidence1.setEvidenceType("SIGNATURE");
        evidence1.setEvidenceContent("数字签名信息：XXX...");
        evidence1.setHashValue(generateHash("数字签名信息：XXX..."));
        evidence1.setOperatorId(archivist.getId());
        evidenceChainRepository.save(evidence1);

        EvidenceChain evidence2 = new EvidenceChain();
        evidence2.setContractId(normalContract.getId());
        evidence2.setEvidenceType("CONTRACT_PRESERVATION");
        evidence2.setEvidenceContent("合同证据保全完成");
        evidence2.setHashValue(generateHash("合同证据保全完成"));
        evidence2.setOperatorId(archivist.getId());
        evidenceChainRepository.save(evidence2);

        addHistory(normalContract.getId(), archivist.getId(), archivist.getRealName(), "EVIDENCE_PRESERVE", "证据保全完成");
        normalContract.setStatus(ContractStatus.EVIDENCE_PRESERVED);
        contractRepository.save(normalContract);
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

    private String generateHash(String content) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}