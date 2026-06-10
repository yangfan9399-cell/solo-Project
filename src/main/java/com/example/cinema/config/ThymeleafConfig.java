
package com.example.cinema.config;

import com.example.cinema.entity.EquipmentStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.extras.java8time.dialect.Java8TimeDialect;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.spring6.templateresolver.SpringResourceTemplateResolver;
import org.thymeleaf.spring6.view.ThymeleafViewResolver;

@Configuration
public class ThymeleafConfig {

    @Bean
    public SpringTemplateEngine templateEngine(SpringResourceTemplateResolver templateResolver) {
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(templateResolver);
        engine.addDialect(new Java8TimeDialect());
        return engine;
    }

    @Bean
    public ThymeleafViewResolver viewResolver(SpringTemplateEngine templateEngine) {
        ThymeleafViewResolver resolver = new ThymeleafViewResolver();
        resolver.setTemplateEngine(templateEngine);
        resolver.setCharacterEncoding("UTF-8");
        return resolver;
    }

    @Bean
    public org.thymeleaf.processor.IProcessor equipmentStatusClassProcessor() {
        return new org.thymeleaf.processor.AbstractProcessor("") {
            @Override
            public int getPrecedence() {
                return 1000;
            }
        };
    }

    public static String getEquipmentStatusClass(EquipmentStatus status) {
        if (status == null) {
            return "status-normal";
        }
        return switch (status) {
            case NORMAL -> "status-normal";
            case ABNORMAL -> "status-abnormal";
            case FAULT, REPAIRING -> "status-fault";
            default -> "status-normal";
        };
    }
}
