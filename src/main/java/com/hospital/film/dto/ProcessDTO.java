package com.hospital.film.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ProcessDTO {

    private String patientName;
    private String medicalRecordNo;
    private String examNo;
    private String examItem;
    private LocalDateTime examTime;
    private String examDepartment;
    private String filmType;
    private Integer filmCount;
    private BigDecimal feeAmount;
    private String feeReceiptNo;
    private LocalDateTime feePayTime;
    private String responsibleParty;
    private String applicationReason;
    private String conclusion;
    private String evidenceBasis;
    private String blockReason;
    private String remedyPath;
    private String description;
    private String operator;
    private String abnormalType;

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getMedicalRecordNo() { return medicalRecordNo; }
    public void setMedicalRecordNo(String medicalRecordNo) { this.medicalRecordNo = medicalRecordNo; }

    public String getExamNo() { return examNo; }
    public void setExamNo(String examNo) { this.examNo = examNo; }

    public String getExamItem() { return examItem; }
    public void setExamItem(String examItem) { this.examItem = examItem; }

    public LocalDateTime getExamTime() { return examTime; }
    public void setExamTime(LocalDateTime examTime) { this.examTime = examTime; }

    public String getExamDepartment() { return examDepartment; }
    public void setExamDepartment(String examDepartment) { this.examDepartment = examDepartment; }

    public String getFilmType() { return filmType; }
    public void setFilmType(String filmType) { this.filmType = filmType; }

    public Integer getFilmCount() { return filmCount; }
    public void setFilmCount(Integer filmCount) { this.filmCount = filmCount; }

    public BigDecimal getFeeAmount() { return feeAmount; }
    public void setFeeAmount(BigDecimal feeAmount) { this.feeAmount = feeAmount; }

    public String getFeeReceiptNo() { return feeReceiptNo; }
    public void setFeeReceiptNo(String feeReceiptNo) { this.feeReceiptNo = feeReceiptNo; }

    public LocalDateTime getFeePayTime() { return feePayTime; }
    public void setFeePayTime(LocalDateTime feePayTime) { this.feePayTime = feePayTime; }

    public String getResponsibleParty() { return responsibleParty; }
    public void setResponsibleParty(String responsibleParty) { this.responsibleParty = responsibleParty; }

    public String getApplicationReason() { return applicationReason; }
    public void setApplicationReason(String applicationReason) { this.applicationReason = applicationReason; }

    public String getConclusion() { return conclusion; }
    public void setConclusion(String conclusion) { this.conclusion = conclusion; }

    public String getEvidenceBasis() { return evidenceBasis; }
    public void setEvidenceBasis(String evidenceBasis) { this.evidenceBasis = evidenceBasis; }

    public String getBlockReason() { return blockReason; }
    public void setBlockReason(String blockReason) { this.blockReason = blockReason; }

    public String getRemedyPath() { return remedyPath; }
    public void setRemedyPath(String remedyPath) { this.remedyPath = remedyPath; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    public String getAbnormalType() { return abnormalType; }
    public void setAbnormalType(String abnormalType) { this.abnormalType = abnormalType; }
}
