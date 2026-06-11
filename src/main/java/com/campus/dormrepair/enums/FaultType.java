package com.campus.dormrepair.enums;

public enum FaultType {
    PLUMBING("水电维修"),
    DOOR_LOCK("门锁维修"),
    FURNITURE("家具维修"),
    APPLIANCE("电器维修"),
    WINDOW("门窗维修"),
    NETWORK("网络维修"),
    OTHER("其他");

    private final String label;

    FaultType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
