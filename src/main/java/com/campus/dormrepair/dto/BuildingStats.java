package com.campus.dormrepair.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BuildingStats {
    private String building;
    private Long totalCount;
    private Long completedCount;
    private Long timeoutCount;
}
