package com.campus.dormrepair.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepairDurationStats {
    private String durationRange;
    private Long count;
}
