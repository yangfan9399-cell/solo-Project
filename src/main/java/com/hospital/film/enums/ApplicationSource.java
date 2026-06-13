package com.hospital.film.enums;

public enum ApplicationSource {
    OUTPATIENT("门诊"),
    INPATIENT("住院"),
    EMERGENCY("急诊"),
    PHYSICAL_EXAM("体检");

    private final String description;

    ApplicationSource(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
