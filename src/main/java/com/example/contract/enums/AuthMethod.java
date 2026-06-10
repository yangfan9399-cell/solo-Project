package com.example.contract.enums;

public enum AuthMethod {
    SMS("短信验证"),
    FACE("人脸识别"),
    ID_CARD("身份证验证"),
    WECHAT("微信认证"),
    ALIPAY("支付宝认证");

    private final String description;

    AuthMethod(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}