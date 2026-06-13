package com.hospital.film.dto;

public class ReviewDTO {

    private String conclusion;
    private String evidenceBasis;
    private String description;
    private String operator;
    private String rejectReason;
    private String remedyPath;

    public String getConclusion() { return conclusion; }
    public void setConclusion(String conclusion) { this.conclusion = conclusion; }

    public String getEvidenceBasis() { return evidenceBasis; }
    public void setEvidenceBasis(String evidenceBasis) { this.evidenceBasis = evidenceBasis; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }

    public String getRemedyPath() { return remedyPath; }
    public void setRemedyPath(String remedyPath) { this.remedyPath = remedyPath; }
}
