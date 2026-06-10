package com.example.coldchain.enums;

public enum ProductType {
    PHARMACEUTICAL("医药"),
    FROZEN_FOOD("冷冻食品"),
    FRESH_PRODUCE("生鲜果蔬"),
    DAIRY("乳制品"),
    OTHER("其他");

    private final String description;

    ProductType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}