package com.example.marketstall.dto;

import com.example.marketstall.entity.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StallDetailDTO {
    private Stall stall;
    private Tenant tenant;
    private List<PaymentRecord> paymentRecords;
    private List<License> licenses;
    private List<ViolationRecord> violationRecords;
    private List<HistoryNode> historyNodes;
    private boolean canRenew;
}