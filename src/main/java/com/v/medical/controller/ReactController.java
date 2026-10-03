package com.v.medical.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ReactController {

    @RequestMapping({
        "/",
        "/home",
        "/auth",
        "/admin",
        "/admin/medicines",
        "/admin/inventory",
        "/admin/suppliers",
        "/admin/expiry",
        "/admin/purchases",
        "/admin/users",
        "/admin/reports",
        "/admin/alerts",
        "/admin/settings",
        "/pharmacy",
        "/pharmacy/inventory",
        "/pharmacy/suppliers",
        "/pharmacy/online-orders",
        "/pharmacy/monitoring",
        "/pharmacy/reports",
        "/pharmacy/notifications",
        "/pharmacy/settings",
        "/staff",
        "/staff/medicines",
        "/staff/inventory",
        "/staff/expiry",
        "/staff/orders",
        "/staff/notifications",
        "/staff/reports",
        "/staff/settings",
        "/medical-inventory",
        "/medical-inventory/**",
        "/{path:[^.]*}"
    })
    public String reactRoutes() {
        return "forward:/index.html";
    }
}
