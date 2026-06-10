
package com.example.cinema.util;

import com.example.cinema.entity.EquipmentStatus;
import org.springframework.stereotype.Component;

@Component
public class EquipmentStatusUtil {

    public String getEquipmentStatusClass(EquipmentStatus status) {
        if (status == null) {
            return "status-normal";
        }
        return switch (status) {
            case NORMAL -> "status-normal";
            case ABNORMAL -> "status-abnormal";
            case FAULT, REPAIRING -> "status-fault";
            default -> "status-normal";
        };
    }
}
