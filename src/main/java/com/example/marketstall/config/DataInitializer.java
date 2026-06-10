package com.example.marketstall.config;

import com.example.marketstall.entity.*;
import com.example.marketstall.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final StallRepository stallRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final LicenseRepository licenseRepository;
    private final ViolationRecordRepository violationRecordRepository;
    private final HistoryNodeRepository historyNodeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        initUsers();
        initTenants();
        initStalls();
        initPaymentRecords();
        initLicenses();
        initViolationRecords();
        initHistoryNodes();
    }

    private void initUsers() {
        if (userRepository.count() == 0) {
            userRepository.save(new User(null, "admin", passwordEncoder.encode("admin123"), "管理员", "ADMIN", "active", LocalDate.now()));
            userRepository.save(new User(null, "cashier", passwordEncoder.encode("cashier123"), "收费员", "CASHIER", "active", LocalDate.now()));
            userRepository.save(new User(null, "inspector", passwordEncoder.encode("inspector123"), "巡查员", "INSPECTOR", "active", LocalDate.now()));
            userRepository.save(new User(null, "supervisor", passwordEncoder.encode("supervisor123"), "主管", "SUPERVISOR", "active", LocalDate.now()));
        }
    }

    private void initTenants() {
        if (tenantRepository.count() == 0) {
            tenantRepository.save(new Tenant(null, "张三", "110101199001011234", "13800138001", "北京市朝阳区", "active", LocalDate.now(), LocalDate.now()));
            tenantRepository.save(new Tenant(null, "李四", "110101199002022345", "13800138002", "北京市海淀区", "active", LocalDate.now(), LocalDate.now()));
            tenantRepository.save(new Tenant(null, "王五", "110101199003033456", "13800138003", "北京市西城区", "active", LocalDate.now(), LocalDate.now()));
            tenantRepository.save(new Tenant(null, "赵六", "110101199004044567", "13800138004", "北京市东城区", "active", LocalDate.now(), LocalDate.now()));
            tenantRepository.save(new Tenant(null, "孙七", "110101199005055678", "13800138005", "北京市丰台区", "active", LocalDate.now(), LocalDate.now()));
        }
    }

    private void initStalls() {
        if (stallRepository.count() == 0) {
            stallRepository.save(new Stall(null, "A001", "A区", "蔬菜", new BigDecimal("10.0"), new BigDecimal("2000"), "leased", 1L, LocalDate.of(2024, 1, 1), LocalDate.of(2025, 12, 31), LocalDate.now(), LocalDate.now()));
            stallRepository.save(new Stall(null, "A002", "A区", "水果", new BigDecimal("8.0"), new BigDecimal("1800"), "leased", 2L, LocalDate.of(2024, 1, 1), LocalDate.of(2025, 6, 30), LocalDate.now(), LocalDate.now()));
            stallRepository.save(new Stall(null, "B001", "B区", "肉类", new BigDecimal("12.0"), new BigDecimal("2500"), "leased", 3L, LocalDate.of(2024, 1, 1), LocalDate.of(2025, 12, 31), LocalDate.now(), LocalDate.now()));
            stallRepository.save(new Stall(null, "B002", "B区", "海鲜", new BigDecimal("15.0"), new BigDecimal("3000"), "leased", 4L, LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31), LocalDate.now(), LocalDate.now()));
            stallRepository.save(new Stall(null, "C001", "C区", "熟食", new BigDecimal("6.0"), new BigDecimal("1500"), "leased", 5L, LocalDate.of(2024, 1, 1), LocalDate.of(2025, 12, 31), LocalDate.now(), LocalDate.now()));
            stallRepository.save(new Stall(null, "C002", "C区", "干货", new BigDecimal("8.0"), new BigDecimal("1800"), "available", null, null, null, LocalDate.now(), LocalDate.now()));
            stallRepository.save(new Stall(null, "A003", "A区", "蔬菜", new BigDecimal("10.0"), new BigDecimal("2000"), "suspended", null, null, null, LocalDate.now(), LocalDate.now()));
        }
    }

    private void initPaymentRecords() {
        if (paymentRecordRepository.count() == 0) {
            paymentRecordRepository.save(new PaymentRecord(null, 1L, LocalDate.of(2024, 1, 15), "2024年1月", new BigDecimal("2000"), "现金", "confirmed", "cashier", LocalDate.now()));
            paymentRecordRepository.save(new PaymentRecord(null, 1L, LocalDate.of(2024, 2, 10), "2024年2月", new BigDecimal("2000"), "转账", "confirmed", "cashier", LocalDate.now()));
            paymentRecordRepository.save(new PaymentRecord(null, 2L, LocalDate.of(2024, 1, 20), "2024年1月", new BigDecimal("1800"), "现金", "confirmed", "cashier", LocalDate.now()));
            paymentRecordRepository.save(new PaymentRecord(null, 2L, null, "2024年2月", new BigDecimal("1800"), "转账", "pending", null, LocalDate.now()));
            paymentRecordRepository.save(new PaymentRecord(null, 3L, LocalDate.of(2024, 1, 10), "2024年1月", new BigDecimal("2500"), "转账", "confirmed", "cashier", LocalDate.now()));
            paymentRecordRepository.save(new PaymentRecord(null, 4L, null, "2024年1月", new BigDecimal("3000"), "转账", "pending", null, LocalDate.now()));
        }
    }

    private void initLicenses() {
        if (licenseRepository.count() == 0) {
            licenseRepository.save(new License(null, 1L, "营业执照", "YZ2024001", LocalDate.of(2024, 1, 1), LocalDate.of(2029, 12, 31), "valid", LocalDate.now(), LocalDate.now()));
            licenseRepository.save(new License(null, 1L, "食品经营许可证", "SP2024001", LocalDate.of(2024, 1, 1), LocalDate.of(2026, 12, 31), "valid", LocalDate.now(), LocalDate.now()));
            licenseRepository.save(new License(null, 2L, "营业执照", "YZ2024002", LocalDate.of(2020, 1, 1), LocalDate.of(2025, 12, 31), "valid", LocalDate.now(), LocalDate.now()));
            licenseRepository.save(new License(null, 2L, "食品经营许可证", "SP2024002", LocalDate.of(2020, 1, 1), LocalDate.of(2023, 12, 31), "expired", LocalDate.now(), LocalDate.now()));
            licenseRepository.save(new License(null, 3L, "营业执照", "YZ2024003", LocalDate.of(2024, 1, 1), LocalDate.of(2029, 12, 31), "valid", LocalDate.now(), LocalDate.now()));
            licenseRepository.save(new License(null, 3L, "食品经营许可证", "SP2024003", LocalDate.of(2024, 1, 1), LocalDate.of(2026, 12, 31), "valid", LocalDate.now(), LocalDate.now()));
            licenseRepository.save(new License(null, 4L, "营业执照", "YZ2024004", LocalDate.of(2024, 1, 1), LocalDate.of(2029, 12, 31), "valid", LocalDate.now(), LocalDate.now()));
            licenseRepository.save(new License(null, 4L, "食品经营许可证", "SP2024004", LocalDate.of(2019, 1, 1), LocalDate.of(2024, 6, 30), "expired", LocalDate.now(), LocalDate.now()));
            licenseRepository.save(new License(null, 5L, "营业执照", "YZ2024005", LocalDate.of(2024, 1, 1), LocalDate.of(2029, 12, 31), "valid", LocalDate.now(), LocalDate.now()));
        }
    }

    private void initViolationRecords() {
        if (violationRecordRepository.count() == 0) {
            violationRecordRepository.save(new ViolationRecord(null, 1L, "占道经营", "摊位前货物摆放超出规定范围", 5, LocalDate.of(2024, 1, 10), "rectified", "inspector", "已整改完成", LocalDate.of(2024, 1, 15), LocalDate.now()));
            violationRecordRepository.save(new ViolationRecord(null, 2L, "占道经营", "占用通道堆放货物", 5, LocalDate.of(2024, 2, 5), "pending", "inspector", null, null, LocalDate.now()));
            violationRecordRepository.save(new ViolationRecord(null, 3L, "卫生不达标", "摊位卫生不符合要求", 3, LocalDate.of(2024, 1, 18), "rectified", "inspector", "已整改完成", LocalDate.of(2024, 1, 20), LocalDate.now()));
            violationRecordRepository.save(new ViolationRecord(null, 4L, "证照过期", "食品经营许可证已过期", 10, LocalDate.of(2024, 1, 20), "pending", "inspector", null, null, LocalDate.now()));
            violationRecordRepository.save(new ViolationRecord(null, 5L, "价格欺诈", "未明码标价", 5, LocalDate.of(2024, 2, 1), "pending", "inspector", null, null, LocalDate.now()));
        }
    }

    private void initHistoryNodes() {
        if (historyNodeRepository.count() == 0) {
            historyNodeRepository.save(new HistoryNode(null, 1L, "REGISTER", "摊位注册成功", "admin", LocalDate.of(2024, 1, 1)));
            historyNodeRepository.save(new HistoryNode(null, 1L, "LEASE", "签订租赁合同，租期: 2024-01-01 至 2025-12-31", "admin", LocalDate.of(2024, 1, 1)));
            historyNodeRepository.save(new HistoryNode(null, 1L, "PAYMENT", "租金缴费，金额: 2000", "cashier", LocalDate.of(2024, 1, 15)));
            historyNodeRepository.save(new HistoryNode(null, 2L, "REGISTER", "摊位注册成功", "admin", LocalDate.of(2024, 1, 1)));
            historyNodeRepository.save(new HistoryNode(null, 2L, "LEASE", "签订租赁合同，租期: 2024-01-01 至 2025-06-30", "admin", LocalDate.of(2024, 1, 1)));
            historyNodeRepository.save(new HistoryNode(null, 2L, "VIOLATION", "记录违规: 占道经营，扣分: 5", "inspector", LocalDate.of(2024, 2, 5)));
        }
    }
}