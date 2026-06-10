
package com.example.cinema.entity;

public enum FaultType {
    PROJECTOR("放映机故障"),
    AUDIO("音响异常"),
    LIGHTING("灯光故障"),
    SEATING("座椅故障"),
    AIR_CONDITIONING("空调故障"),
    OTHER("其他故障");

    private final String description;

    FaultType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
