package com.hospital.film.dto;

import com.hospital.film.enums.ApplicationSource;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FilmReissueCreateDTO {

    private ApplicationSource source;
    private String patientName;
    private String idCardNo;
    private String medicalRecordNo;
    private String examNo;
    private String examItem;
    private LocalDateTime examTime;
    private String examDepartment;
    private String filmType;
    private Integer filmCount;
    private BigDecimal feeAmount;
    private String feeReceiptNo;
    private String responsibleParty;
    private String applicationReason;
    private String applicant;
    private String remark;

    public ApplicationSource getSource() { return source; }
    public void setSource(ApplicationSource source) { this.source = source; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getIdCardNo() { return idCardNo; }
    public void setIdCardNo(String idCardNo) { this.idCardNo = idCardNo; }

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

    public String getResponsibleParty() { return responsibleParty; }
    public void setResponsibleParty(String responsibleParty) { this.responsibleParty = responsibleParty; }

    public String getApplicationReason() { return applicationReason; }
    public void setApplicationReason(String applicationReason) { this.applicationReason = applicationReason; }

    public String getApplicant() { return applicant; }
    public void setApplicant(String applicant) { this.applicant = applicant; }

    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
}
