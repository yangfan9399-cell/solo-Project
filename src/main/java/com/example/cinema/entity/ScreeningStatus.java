
package com.example.cinema.entity;

public enum ScreeningStatus {
    SCHEDULED("已排期"),
    INSPECTED("已巡检"),
    PLAYING("放映中"),
    INTERRUPTED("已中断"),
    RESUMED("已恢复"),
    COMPLETED("已完成"),
    CANCELLED("已取消");

    private final String description;

    ScreeningStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
