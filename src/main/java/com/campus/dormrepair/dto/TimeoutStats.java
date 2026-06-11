package com.campus.dormrepair.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeoutStats {
    private String timeoutReason;
    private String timeoutReasonLabel;
    private Long count;
}
