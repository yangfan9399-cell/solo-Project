
package com.example.petshipping.enums;

public enum PetType {
    DOG("犬"),
    CAT("猫"),
    BIRD("鸟类"),
    RABBIT("兔"),
    OTHER("其他");

    private final String description;

    PetType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
