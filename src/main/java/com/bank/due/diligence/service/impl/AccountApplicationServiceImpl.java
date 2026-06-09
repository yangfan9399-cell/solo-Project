package com.bank.due.diligence.service.impl;

import com.bank.due.diligence.entity.*;
import com.bank.due.diligence.enums.*;
import com.bank.due.diligence.repository.*;
import com.bank.due.diligence.service.AccountApplicationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountApplicationServiceImpl implements AccountApplicationService {

    private final AccountApplicationRepository applicationRepository;
    private final ApplicationHistoryRepository historyRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final BranchRepository branchRepository;
    private final MaterialRepository materialRepository;
    private final BusinessAddressRepository addressRepository;

    private final AtomicInteger counter = new AtomicInteger(0);

    @Override
    public AccountApplication getById(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("申请不存在: " + id));
    }

    @Override
    public AccountApplication getByApplicationNo(String applicationNo) {
        AccountApplication app = applicationRepository.findByApplicationNo(applicationNo);
        if (app == null) {
            throw new EntityNotFoundException("申请不存在: " + applicationNo);
        }
        return app;
    }

    @Override
    public List<AccountApplication> findAll() {
        return applicationRepository.findAll();
    }

    @Override
    public List<AccountApplication> findByStatus(ApplicationStatus status) {
        return applicationRepository.findByStatus(status);
    }

    @Override
    public List<AccountApplication> findByStatuses(List<ApplicationStatus> statuses) {
        return applicationRepository.findByStatusIn(statuses);
    }

    @Override
    public List<ApplicationHistory> getHistories(Long applicationId) {
        return historyRepository.findByApplicationIdOrderByCreateTimeAsc(applicationId);
    }

    @Override
    @Transactional
    public AccountApplication createApplication(AccountApplication application, Long enterpriseId, Long branchId) {
        Enterprise enterprise = enterpriseRepository.findById(enterpriseId)
                .orElseThrow(() -> new EntityNotFoundException("企业不存在"));
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new EntityNotFoundException("支行不存在"));

        application.setEnterprise(enterprise);
        application.setBranch(branch);
        application.setApplicationNo(generateApplicationNo());
        application.setStatus(ApplicationStatus.DRAFT);

        AccountApplication saved = applicationRepository.save(application);
        addHistory(saved, ApplicationStatus.DRAFT, ApplicationStatus.DRAFT,
                "创建申请", application.getCustomerManagerName(), RoleType.CUSTOMER_MANAGER,
                "创建开户申请");

        log.info("创建开户申请: {}", saved.getApplicationNo());
        return saved;
    }

    @Override
    @Transactional
    public AccountApplication submitApplication(Long id, String operatorName) {
        AccountApplication app = getById(id);
        ApplicationStatus fromStatus = app.getStatus();

        if (fromStatus != ApplicationStatus.DRAFT && fromStatus != ApplicationStatus.MATERIAL_DEFICIENT) {
            throw new IllegalStateException("当前状态不允许提交: " + fromStatus.getDescription());
        }

        app.setStatus(ApplicationStatus.PENDING_OPERATION);
        app.setSubmitTime(LocalDateTime.now());
        app.setCustomerManagerName(operatorName);

        AccountApplication saved = applicationRepository.save(app);
        addHistory(saved, fromStatus, ApplicationStatus.PENDING_OPERATION,
                "提交申请", operatorName, RoleType.CUSTOMER_MANAGER,
                "提交开户申请，等待运营核验");

        log.info("提交申请: {}", saved.getApplicationNo());
        return saved;
    }

    @Override
    @Transactional
    public AccountApplication operationVerifyPass(Long id, String operatorName, String comment) {
        AccountApplication app = getById(id);
        ApplicationStatus fromStatus = app.getStatus();

        if (fromStatus != ApplicationStatus.PENDING_OPERATION) {
            throw new IllegalStateException("当前状态不允许运营核验通过: " + fromStatus.getDescription());
        }

        List<BusinessAddress> addresses = addressRepository.findByEnterpriseId(app.getEnterprise().getId());
        boolean allAddressesVerified = addresses.stream().allMatch(BusinessAddress::getIsVerified);

        if (!allAddressesVerified) {
            app.setStatus(ApplicationStatus.ADDRESS_VERIFICATION_FAILED);
            app.setReturnReason("地址核验失败");
            app.setOperationStaffName(operatorName);
            app.setOperationVerifyTime(LocalDateTime.now());

            AccountApplication saved = applicationRepository.save(app);
            addHistory(saved, fromStatus, ApplicationStatus.ADDRESS_VERIFICATION_FAILED,
                    "地址核验失败", operatorName, RoleType.OPERATION_STAFF,
                    "经营地址核验未通过，需重新尽调");

            log.info("地址核验失败: {}", saved.getApplicationNo());
            return saved;
        }

        app.setStatus(ApplicationStatus.PENDING_RISK);
        app.setOperationStaffName(operatorName);
        app.setOperationVerifyTime(LocalDateTime.now());

        AccountApplication saved = applicationRepository.save(app);
        addHistory(saved, fromStatus, ApplicationStatus.PENDING_RISK,
                "材料核验通过", operatorName, RoleType.OPERATION_STAFF,
                comment != null ? comment : "材料核验通过，进入风险复核");

        log.info("运营核验通过: {}", saved.getApplicationNo());
        return saved;
    }

    @Override
    @Transactional
    public AccountApplication operationVerifyFail(Long id, String operatorName, String returnReason, String comment) {
        AccountApplication app = getById(id);
        ApplicationStatus fromStatus = app.getStatus();

        if (fromStatus != ApplicationStatus.PENDING_OPERATION) {
            throw new IllegalStateException("当前状态不允许退回: " + fromStatus.getDescription());
        }

        app.setStatus(ApplicationStatus.MATERIAL_DEFICIENT);
        app.setReturnReason(returnReason);
        app.setOperationStaffName(operatorName);
        app.setOperationVerifyTime(LocalDateTime.now());

        AccountApplication saved = applicationRepository.save(app);
        addHistory(saved, fromStatus, ApplicationStatus.MATERIAL_DEFICIENT,
                "材料缺失退回", operatorName, RoleType.OPERATION_STAFF,
                comment != null ? comment : returnReason);

        log.info("运营核验退回: {}, 原因: {}", saved.getApplicationNo(), returnReason);
        return saved;
    }

    @Override
    @Transactional
    public AccountApplication riskReview(Long id, String operatorName, String riskLevelStr, String riskComment, String comment) {
        AccountApplication app = getById(id);
        ApplicationStatus fromStatus = app.getStatus();

        if (fromStatus != ApplicationStatus.PENDING_RISK) {
            throw new IllegalStateException("当前状态不允许风险复核: " + fromStatus.getDescription());
        }

        RiskLevel riskLevel = RiskLevel.valueOf(riskLevelStr);
        app.setRiskLevel(riskLevel);
        app.setRiskComment(riskComment);
        app.setRiskControlName(operatorName);
        app.setRiskReviewTime(LocalDateTime.now());

        ApplicationStatus toStatus;
        String action;

        if (riskLevel == RiskLevel.HIGH) {
            toStatus = ApplicationStatus.HIGH_RISK;
            action = "高风险认定";
        } else {
            toStatus = ApplicationStatus.PENDING_APPROVAL;
            action = "风险复核通过";
        }

        app.setStatus(toStatus);

        AccountApplication saved = applicationRepository.save(app);
        addHistory(saved, fromStatus, toStatus, action, operatorName, RoleType.RISK_CONTROL,
                comment != null ? comment : "风险等级: " + riskLevel.getDescription());

        log.info("风险复核完成: {}, 风险等级: {}", saved.getApplicationNo(), riskLevel);
        return saved;
    }

    @Override
    @Transactional
    public AccountApplication approve(Long id, String operatorName, String comment) {
        AccountApplication app = getById(id);
        ApplicationStatus fromStatus = app.getStatus();

        if (fromStatus != ApplicationStatus.PENDING_APPROVAL && fromStatus != ApplicationStatus.HIGH_RISK) {
            throw new IllegalStateException("当前状态不允许审批通过: " + fromStatus.getDescription());
        }

        List<BusinessAddress> addresses = addressRepository.findByEnterpriseId(app.getEnterprise().getId());
        boolean hasUnverifiedAddress = addresses.stream().anyMatch(addr -> !addr.getIsVerified());

        if (hasUnverifiedAddress) {
            throw new IllegalStateException("存在未通过核验的经营地址，不得开户");
        }

        app.setStatus(ApplicationStatus.APPROVED);
        app.setSupervisorName(operatorName);
        app.setApprovalTime(LocalDateTime.now());

        AccountApplication saved = applicationRepository.save(app);
        addHistory(saved, fromStatus, ApplicationStatus.APPROVED,
                "主管审批通过", operatorName, RoleType.SUPERVISOR,
                comment != null ? comment : "同意开户");

        log.info("开户批准: {}", saved.getApplicationNo());
        return saved;
    }

    @Override
    @Transactional
    public AccountApplication reject(Long id, String operatorName, String rejectReason, String comment) {
        AccountApplication app = getById(id);
        ApplicationStatus fromStatus = app.getStatus();

        if (fromStatus != ApplicationStatus.PENDING_APPROVAL && fromStatus != ApplicationStatus.HIGH_RISK) {
            throw new IllegalStateException("当前状态不允许拒绝: " + fromStatus.getDescription());
        }

        app.setStatus(ApplicationStatus.REJECTED);
        app.setRejectReason(rejectReason);
        app.setSupervisorName(operatorName);
        app.setApprovalTime(LocalDateTime.now());

        AccountApplication saved = applicationRepository.save(app);
        addHistory(saved, fromStatus, ApplicationStatus.REJECTED,
                "主管拒绝开户", operatorName, RoleType.SUPERVISOR,
                comment != null ? comment : rejectReason);

        log.info("开户拒绝: {}, 原因: {}", saved.getApplicationNo(), rejectReason);
        return saved;
    }

    @Override
    @Transactional
    public AccountApplication returnToCustomerManager(Long id, String operatorName, String returnReason, String comment) {
        AccountApplication app = getById(id);
        ApplicationStatus fromStatus = app.getStatus();

        if (fromStatus != ApplicationStatus.PENDING_APPROVAL && fromStatus != ApplicationStatus.HIGH_RISK) {
            throw new IllegalStateException("当前状态不允许退回: " + fromStatus.getDescription());
        }

        app.setStatus(ApplicationStatus.RETURNED);
        app.setReturnReason(returnReason);
        app.setSupervisorName(operatorName);

        AccountApplication saved = applicationRepository.save(app);
        addHistory(saved, fromStatus, ApplicationStatus.RETURNED,
                "主管退回", operatorName, RoleType.SUPERVISOR,
                comment != null ? comment : returnReason);

        log.info("申请退回: {}, 原因: {}", saved.getApplicationNo(), returnReason);
        return saved;
    }

    @Override
    @Transactional
    public AccountApplication resubmitAfterSupplement(Long id, String operatorName, String comment) {
        AccountApplication app = getById(id);
        ApplicationStatus fromStatus = app.getStatus();

        if (fromStatus != ApplicationStatus.MATERIAL_DEFICIENT) {
            throw new IllegalStateException("当前状态不允许补正后重提: " + fromStatus.getDescription());
        }

        app.setStatus(ApplicationStatus.PENDING_OPERATION);

        AccountApplication saved = applicationRepository.save(app);
        addHistory(saved, fromStatus, ApplicationStatus.PENDING_OPERATION,
                "材料补正后重提", operatorName, RoleType.CUSTOMER_MANAGER,
                comment != null ? comment : "已补充材料，重新提交核验");

        log.info("材料补正后重提: {}", saved.getApplicationNo());
        return saved;
    }

    @Override
    @Transactional
    public AccountApplication reDueDiligence(Long id, String operatorName, String comment) {
        AccountApplication app = getById(id);
        ApplicationStatus fromStatus = app.getStatus();

        if (fromStatus != ApplicationStatus.ADDRESS_VERIFICATION_FAILED) {
            throw new IllegalStateException("当前状态不允许重新尽调: " + fromStatus.getDescription());
        }

        app.setStatus(ApplicationStatus.DRAFT);

        AccountApplication saved = applicationRepository.save(app);
        addHistory(saved, fromStatus, ApplicationStatus.DRAFT,
                "重新尽调", operatorName, RoleType.CUSTOMER_MANAGER,
                comment != null ? comment : "地址核验失败，重新开展尽调");

        log.info("重新尽调: {}", saved.getApplicationNo());
        return saved;
    }

    private void addHistory(AccountApplication app, ApplicationStatus from, ApplicationStatus to,
                            String action, String operatorName, RoleType role, String comment) {
        ApplicationHistory history = new ApplicationHistory();
        history.setApplication(app);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setAction(action);
        history.setOperatorName(operatorName);
        history.setOperatorRole(role != null ? role.getDescription() : "");
        history.setComment(comment);
        historyRepository.save(history);
    }

    private String generateApplicationNo() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int seq = counter.incrementAndGet();
        return String.format("KH%s%04d", date, seq);
    }
}
