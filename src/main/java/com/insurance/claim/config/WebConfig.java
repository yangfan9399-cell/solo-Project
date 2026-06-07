package com.insurance.claim.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(String.class, LocalDate.class,
                source -> LocalDate.parse(source, DateTimeFormatter.ISO_LOCAL_DATE));
        registry.addConverter(String.class, LocalDateTime.class,
                source -> LocalDateTime.parse(source, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
    }
}
