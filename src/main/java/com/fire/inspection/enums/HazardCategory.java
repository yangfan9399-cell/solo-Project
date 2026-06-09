package com.fire.inspection.enums;

import lombok.Getter;

@Getter
public enum HazardCategory {
    FIRE_EXTINGUISHER("消防器材"),
    FIRE_HYDRANT("消防栓"),
    EMERGENCY_LIGHT("应急照明"),
    EVACUATION_SIGN("疏散指示"),
    FIRE_DOOR("防火门"),
    CHANNEL_BLOCKAGE("通道占用"),
    ELECTRICAL_HAZARD("电气隐患"),
    OTHER("其他");

    private final String displayName;

    HazardCategory(String displayName) {
        this.displayName = displayName;
    }
}
