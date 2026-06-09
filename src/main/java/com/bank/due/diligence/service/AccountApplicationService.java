package com.bank.due.diligence.service;

import com.bank.due.diligence.entity.AccountApplication;
import com.bank.due.diligence.entity.ApplicationHistory;
import com.bank.due.diligence.enums.ApplicationStatus;

import java.util.List;

public interface AccountApplicationService {

    AccountApplication getById(Long id);

    AccountApplication getByApplicationNo(String applicationNo);

    List<AccountApplication> findAll();

    List<AccountApplication> findByStatus(ApplicationStatus status);

    List<AccountApplication> findByStatuses(List<ApplicationStatus> statuses);

    List<ApplicationHistory> getHistories(Long applicationId);

    AccountApplication createApplication(AccountApplication application, Long enterpriseId, Long branchId);

    AccountApplication submitApplication(Long id, String operatorName);

    AccountApplication operationVerifyPass(Long id, String operatorName, String comment);

    AccountApplication operationVerifyFail(Long id, String operatorName, String returnReason, String comment);

    AccountApplication riskReview(Long id, String operatorName, String riskLevel, String riskComment, String comment);

    AccountApplication approve(Long id, String operatorName, String comment);

    AccountApplication reject(Long id, String operatorName, String rejectReason, String comment);

    AccountApplication returnToCustomerManager(Long id, String operatorName, String returnReason, String comment);

    AccountApplication resubmitAfterSupplement(Long id, String operatorName, String comment);

    AccountApplication reDueDiligence(Long id, String operatorName, String comment);
}
