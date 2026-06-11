package com.hotel.maintenance.enums;

public enum FaultType {
    PLUMBING("水电故障"),
    HVAC("空调故障"),
    FURNITURE("家具损坏"),
    APPLIANCE("电器故障"),
    BATHROOM("卫浴故障"),
    NETWORK("网络故障"),
    SECURITY("门锁故障"),
    WALL_DECOR("墙面装饰"),
    OTHER("其他");

    private final String description;

    FaultType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
