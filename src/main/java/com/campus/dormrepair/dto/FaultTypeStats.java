package com.campus.dormrepair.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaultTypeStats {
    private String faultType;
    private String faultTypeLabel;
    private Long count;
    private Double avgRepairMinutes;
}
