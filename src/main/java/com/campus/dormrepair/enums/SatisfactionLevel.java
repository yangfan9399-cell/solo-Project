package com.campus.dormrepair.enums;

public enum SatisfactionLevel {
    VERY_SATISFIED("非常满意", 5),
    SATISFIED("满意", 4),
    NEUTRAL("一般", 3),
    DISSATISFIED("不满意", 2),
    VERY_DISSATISFIED("非常不满意", 1);

    private final String label;
    private final int score;

    SatisfactionLevel(String label, int score) {
        this.label = label;
        this.score = score;
    }

    public String getLabel() {
        return label;
    }

    public int getScore() {
        return score;
    }
}
