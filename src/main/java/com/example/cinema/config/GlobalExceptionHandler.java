
package com.example.cinema.config;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public String handleRuntimeException(RuntimeException e, Model model) {
        model.addAttribute("error", e.getMessage());
        model.addAttribute("pageTitle", "错误");
        model.addAttribute("activeMenu", "dashboard");
        return "error";
    }
}
