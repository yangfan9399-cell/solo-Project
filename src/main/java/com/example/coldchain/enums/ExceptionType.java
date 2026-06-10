package com.example.coldchain.enums;

public enum ExceptionType {
    TEMPERATURE_OVER_LIMIT("温度超限"),
    SENSOR_OFFLINE("传感器离线"),
    ROUTE_DELAY("路线延误"),
    OTHER("其他");

    private final String description;

    ExceptionType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}