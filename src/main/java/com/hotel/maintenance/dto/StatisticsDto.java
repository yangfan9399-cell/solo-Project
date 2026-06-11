package com.hotel.maintenance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsDto {
    private String groupName;
    private Long orderCount;
    private Long overdueCount;
    private Long complaintCount;
    private Double avgOutageHours;
    private Double totalCost;
}
