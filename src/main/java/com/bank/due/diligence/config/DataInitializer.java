package com.bank.due.diligence.config;

import com.bank.due.diligence.entity.*;
import com.bank.due.diligence.enums.*;
import com.bank.due.diligence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SysUserRepository userRepository;
    private final BranchRepository branchRepository;
    private final EnterpriseRepository enterpriseRepository;
    private final LegalPersonRepository legalPersonRepository;
    private final BeneficialOwnerRepository beneficialOwnerRepository;
    private final BusinessAddressRepository addressRepository;
    private final AccountApplicationRepository applicationRepository;
    private final MaterialRepository materialRepository;
    private final RiskTagRepository riskTagRepository;
    private final ApplicationHistoryRepository historyRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("数据已存在，跳过初始化");
            return;
        }

        log.info("开始初始化样本数据...");

        initBranches();
        initUsers();
        initEnterprises();
        initApplications();

        log.info("样本数据初始化完成");
    }

    private void initBranches() {
        Branch branch1 = new Branch();
        branch1.setBranchCode("BR001");
        branch1.setBranchName("总行营业部");
        branch1.setAddress("北京市朝阳区建国路88号");
        branch1.setPhone("010-88888888");
        branchRepository.save(branch1);

        Branch branch2 = new Branch();
        branch2.setBranchCode("BR002");
        branch2.setBranchName("海淀支行");
        branch2.setAddress("北京市海淀区中关村大街1号");
        branch2.setPhone("010-66666666");
        branchRepository.save(branch2);

        Branch branch3 = new Branch();
        branch3.setBranchCode("BR003");
        branch3.setBranchName("西城支行");
        branch3.setAddress("北京市西城区金融街35号");
        branch3.setPhone("010-77777777");
        branchRepository.save(branch3);

        log.info("支行数据初始化完成");
    }

    private void initUsers() {
        Branch branch1 = branchRepository.findByBranchCode("BR001").orElseThrow();
        Branch branch2 = branchRepository.findByBranchCode("BR002").orElseThrow();

        SysUser cm1 = new SysUser();
        cm1.setUsername("zhangsan");
        cm1.setPassword(passwordEncoder.encode("123456"));
        cm1.setRealName("张三");
        cm1.setRole(RoleType.CUSTOMER_MANAGER);
        cm1.setPhone("13800138001");
        cm1.setBranch(branch1);
        userRepository.save(cm1);

        SysUser cm2 = new SysUser();
        cm2.setUsername("lisi");
        cm2.setPassword(passwordEncoder.encode("123456"));
        cm2.setRealName("李四");
        cm2.setRole(RoleType.CUSTOMER_MANAGER);
        cm2.setPhone("13800138002");
        cm2.setBranch(branch2);
        userRepository.save(cm2);

        SysUser op1 = new SysUser();
        op1.setUsername("wangwu");
        op1.setPassword(passwordEncoder.encode("123456"));
        op1.setRealName("王五");
        op1.setRole(RoleType.OPERATION_STAFF);
        op1.setPhone("13800138003");
        op1.setBranch(branch1);
        userRepository.save(op1);

        SysUser rc1 = new SysUser();
        rc1.setUsername("zhaoliu");
        rc1.setPassword(passwordEncoder.encode("123456"));
        rc1.setRealName("赵六");
        rc1.setRole(RoleType.RISK_CONTROL);
        rc1.setPhone("13800138004");
        rc1.setBranch(branch1);
        userRepository.save(rc1);

        SysUser sv1 = new SysUser();
        sv1.setUsername("qianqi");
        sv1.setPassword(passwordEncoder.encode("123456"));
        sv1.setRealName("钱七");
        sv1.setRole(RoleType.SUPERVISOR);
        sv1.setPhone("13800138005");
        sv1.setBranch(branch1);
        userRepository.save(sv1);

        log.info("用户数据初始化完成");
    }

    private void initEnterprises() {
        Branch branch1 = branchRepository.findByBranchCode("BR001").orElseThrow();
        Branch branch2 = branchRepository.findByBranchCode("BR002").orElseThrow();

        Enterprise e1 = new Enterprise();
        e1.setEnterpriseCode("ENT001");
        e1.setEnterpriseName("北京华信科技有限公司");
        e1.setUnifiedSocialCreditCode("91110105MA008XYZ12");
        e1.setIndustry("信息技术");
        e1.setIndustryCategory("软件和信息技术服务业");
        e1.setEnterpriseType("有限责任公司");
        e1.setRegisteredCapital(new BigDecimal("500.00"));
        e1.setEstablishmentDate("2020-03-15");
        e1.setBusinessScope("技术开发、技术咨询、技术服务、技术转让；计算机系统服务；软件开发。");
        e1.setContactPhone("010-88668866");
        e1.setContactEmail("contact@huaxin.com");
        e1.setBranch(branch1);
        enterpriseRepository.save(e1);

        LegalPerson lp1 = new LegalPerson();
        lp1.setEnterprise(e1);
        lp1.setName("陈明");
        lp1.setIdType("居民身份证");
        lp1.setIdNumber("110105198001011234");
        lp1.setPhone("13900139001");
        lp1.setAddress("北京市朝阳区建国路88号");
        lp1.setPosition("执行董事兼总经理");
        lp1.setIsActualController(true);
        legalPersonRepository.save(lp1);

        BeneficialOwner bo1 = new BeneficialOwner();
        bo1.setEnterprise(e1);
        bo1.setName("陈明");
        bo1.setIdType("居民身份证");
        bo1.setIdNumber("110105198001011234");
        bo1.setPhone("13900139001");
        bo1.setAddress("北京市朝阳区建国路88号");
        bo1.setShareholdingRatio(new BigDecimal("70.00"));
        bo1.setRelationship("法人");
        beneficialOwnerRepository.save(bo1);

        BeneficialOwner bo2 = new BeneficialOwner();
        bo2.setEnterprise(e1);
        bo2.setName("刘芳");
        bo2.setIdType("居民身份证");
        bo2.setIdNumber("110105198505055678");
        bo2.setPhone("13900139002");
        bo2.setAddress("北京市海淀区中关村大街100号");
        bo2.setShareholdingRatio(new BigDecimal("30.00"));
        bo2.setRelationship("股东");
        beneficialOwnerRepository.save(bo2);

        BusinessAddress ba1 = new BusinessAddress();
        ba1.setEnterprise(e1);
        ba1.setAddressType("注册地址");
        ba1.setProvince("北京市");
        ba1.setCity("北京市");
        ba1.setDistrict("朝阳区");
        ba1.setDetailAddress("建国路88号华贸中心A座1501室");
        ba1.setZipCode("100022");
        ba1.setPhone("010-88668866");
        ba1.setIsVerified(true);
        ba1.setVerificationResult("地址核验通过，与营业执照一致");
        ba1.setVerifier("王五");
        ba1.setVerifyTime(LocalDateTime.now().minusDays(2));
        addressRepository.save(ba1);

        Enterprise e2 = new Enterprise();
        e2.setEnterpriseCode("ENT002");
        e2.setEnterpriseName("北京鼎盛贸易有限公司");
        e2.setUnifiedSocialCreditCode("91110108MA012ABC34");
        e2.setIndustry("批发零售");
        e2.setIndustryCategory("批发业");
        e2.setEnterpriseType("有限责任公司");
        e2.setRegisteredCapital(new BigDecimal("1000.00"));
        e2.setEstablishmentDate("2019-08-20");
        e2.setBusinessScope("销售电子产品、机械设备、五金交电、建筑材料；货物进出口。");
        e2.setContactPhone("010-66776677");
        e2.setContactEmail("info@dingsheng.com");
        e2.setBranch(branch2);
        enterpriseRepository.save(e2);

        LegalPerson lp2 = new LegalPerson();
        lp2.setEnterprise(e2);
        lp2.setName("周强");
        lp2.setIdType("居民身份证");
        lp2.setIdNumber("110108197808089012");
        lp2.setPhone("13700137001");
        lp2.setAddress("北京市海淀区中关村大街1号");
        lp2.setPosition("执行董事");
        lp2.setIsActualController(true);
        legalPersonRepository.save(lp2);

        BeneficialOwner bo3 = new BeneficialOwner();
        bo3.setEnterprise(e2);
        bo3.setName("周强");
        bo3.setIdType("居民身份证");
        bo3.setIdNumber("110108197808089012");
        bo3.setPhone("13700137001");
        bo3.setAddress("北京市海淀区中关村大街1号");
        bo3.setShareholdingRatio(new BigDecimal("60.00"));
        bo3.setRelationship("法人");
        beneficialOwnerRepository.save(bo3);

        BusinessAddress ba2 = new BusinessAddress();
        ba2.setEnterprise(e2);
        ba2.setAddressType("注册地址");
        ba2.setProvince("北京市");
        ba2.setCity("北京市");
        ba2.setDistrict("海淀区");
        ba2.setDetailAddress("中关村大街1号海龙大厦8层801");
        ba2.setZipCode("100080");
        ba2.setPhone("010-66776677");
        ba2.setIsVerified(true);
        ba2.setVerificationResult("地址核验通过");
        ba2.setVerifier("王五");
        ba2.setVerifyTime(LocalDateTime.now().minusDays(1));
        addressRepository.save(ba2);

        Enterprise e3 = new Enterprise();
        e3.setEnterpriseCode("ENT003");
        e3.setEnterpriseName("北京鑫源投资管理有限公司");
        e3.setUnifiedSocialCreditCode("91110102MA009DEF56");
        e3.setIndustry("金融投资");
        e3.setIndustryCategory("投资与资产管理");
        e3.setEnterpriseType("有限责任公司");
        e3.setRegisteredCapital(new BigDecimal("5000.00"));
        e3.setEstablishmentDate("2018-06-10");
        e3.setBusinessScope("投资管理；资产管理；项目投资；投资咨询。");
        e3.setContactPhone("010-77887788");
        e3.setContactEmail("contact@xinyuan.com");
        e3.setBranch(branch1);
        enterpriseRepository.save(e3);

        LegalPerson lp3 = new LegalPerson();
        lp3.setEnterprise(e3);
        lp3.setName("吴建华");
        lp3.setIdType("居民身份证");
        lp3.setIdNumber("110102197503153456");
        lp3.setPhone("13600136001");
        lp3.setAddress("北京市西城区金融街35号");
        lp3.setPosition("董事长");
        lp3.setIsActualController(true);
        legalPersonRepository.save(lp3);

        BeneficialOwner bo4 = new BeneficialOwner();
        bo4.setEnterprise(e3);
        bo4.setName("吴建华");
        bo4.setIdType("居民身份证");
        bo4.setIdNumber("110102197503153456");
        bo4.setPhone("13600136001");
        bo4.setAddress("北京市西城区金融街35号");
        bo4.setShareholdingRatio(new BigDecimal("51.00"));
        bo4.setRelationship("法人");
        beneficialOwnerRepository.save(bo4);

        BusinessAddress ba3 = new BusinessAddress();
        ba3.setEnterprise(e3);
        ba3.setAddressType("注册地址");
        ba3.setProvince("北京市");
        ba3.setCity("北京市");
        ba3.setDistrict("西城区");
        ba3.setDetailAddress("金融街35号国际企业大厦20层");
        ba3.setZipCode("100032");
        ba3.setPhone("010-77887788");
        ba3.setIsVerified(true);
        ba3.setVerificationResult("地址核验通过");
        ba3.setVerifier("王五");
        ba3.setVerifyTime(LocalDateTime.now().minusDays(3));
        addressRepository.save(ba3);

        Enterprise e4 = new Enterprise();
        e4.setEnterpriseCode("ENT004");
        e4.setEnterpriseName("北京恒昌制造有限公司");
        e4.setUnifiedSocialCreditCode("91110106MA011GHI78");
        e4.setIndustry("制造业");
        e4.setIndustryCategory("通用设备制造业");
        e4.setEnterpriseType("有限责任公司");
        e4.setRegisteredCapital(new BigDecimal("2000.00"));
        e4.setEstablishmentDate("2017-11-05");
        e4.setBusinessScope("制造机械设备；销售机械设备、五金交电、电子产品。");
        e4.setContactPhone("010-66556655");
        e4.setContactEmail("info@hengchang.com");
        e4.setBranch(branch2);
        enterpriseRepository.save(e4);

        LegalPerson lp4 = new LegalPerson();
        lp4.setEnterprise(e4);
        lp4.setName("孙国华");
        lp4.setIdType("居民身份证");
        lp4.setIdNumber("110106197212127890");
        lp4.setPhone("13500135001");
        lp4.setAddress("北京市丰台区南三环西路16号");
        lp4.setPosition("总经理");
        lp4.setIsActualController(false);
        legalPersonRepository.save(lp4);

        BeneficialOwner bo5 = new BeneficialOwner();
        bo5.setEnterprise(e4);
        bo5.setName("孙国华");
        bo5.setIdType("居民身份证");
        bo5.setIdNumber("110106197212127890");
        bo5.setPhone("13500135001");
        bo5.setAddress("北京市丰台区南三环西路16号");
        bo5.setShareholdingRatio(new BigDecimal("20.00"));
        bo5.setRelationship("法人");
        beneficialOwnerRepository.save(bo5);

        BusinessAddress ba4 = new BusinessAddress();
        ba4.setEnterprise(e4);
        ba4.setAddressType("注册地址");
        ba4.setProvince("北京市");
        ba4.setCity("北京市");
        ba4.setDistrict("丰台区");
        ba4.setDetailAddress("南三环西路16号搜宝商务中心B座1201");
        ba4.setZipCode("100068");
        ba4.setPhone("010-66556655");
        ba4.setIsVerified(false);
        ba4.setVerificationResult("");
        addressRepository.save(ba4);

        log.info("企业数据初始化完成");
    }

    private void initApplications() {
        Enterprise e1 = enterpriseRepository.findByEnterpriseCode("ENT001").orElseThrow();
        Enterprise e2 = enterpriseRepository.findByEnterpriseCode("ENT002").orElseThrow();
        Enterprise e3 = enterpriseRepository.findByEnterpriseCode("ENT003").orElseThrow();
        Enterprise e4 = enterpriseRepository.findByEnterpriseCode("ENT004").orElseThrow();

        Branch branch1 = branchRepository.findByBranchCode("BR001").orElseThrow();
        Branch branch2 = branchRepository.findByBranchCode("BR002").orElseThrow();

        AccountApplication app1 = new AccountApplication();
        app1.setApplicationNo("KH202501010001");
        app1.setEnterprise(e1);
        app1.setBranch(branch1);
        app1.setStatus(ApplicationStatus.APPROVED);
        app1.setAccountType("基本存款账户");
        app1.setRiskLevel(RiskLevel.LOW);
        app1.setRiskComment("企业经营正常，风险较低");
        app1.setCustomerManagerName("张三");
        app1.setCustomerManagerPhone("13800138001");
        app1.setOperationStaffName("王五");
        app1.setRiskControlName("赵六");
        app1.setSupervisorName("钱七");
        app1.setSubmitTime(LocalDateTime.now().minusDays(10));
        app1.setOperationVerifyTime(LocalDateTime.now().minusDays(8));
        app1.setRiskReviewTime(LocalDateTime.now().minusDays(5));
        app1.setApprovalTime(LocalDateTime.now().minusDays(2));
        app1.setRemark("正常开户流程样本");
        applicationRepository.save(app1);

        addMaterialsForNormal(app1);
        addHistoryRecord(app1, ApplicationStatus.DRAFT, ApplicationStatus.PENDING_OPERATION, "提交申请", "张三", "客户经理", "提交开户申请");
        addHistoryRecord(app1, ApplicationStatus.PENDING_OPERATION, ApplicationStatus.PENDING_RISK, "材料核验通过", "王五", "运营人员", "材料齐全，核验通过");
        addHistoryRecord(app1, ApplicationStatus.PENDING_RISK, ApplicationStatus.PENDING_APPROVAL, "风险复核通过", "赵六", "风控人员", "低风险，符合准入条件");
        addHistoryRecord(app1, ApplicationStatus.PENDING_APPROVAL, ApplicationStatus.APPROVED, "主管审批通过", "钱七", "主管", "同意开户");

        RiskTag rt1 = new RiskTag();
        rt1.setApplication(app1);
        rt1.setTagName("行业风险");
        rt1.setRiskLevel(RiskLevel.LOW);
        rt1.setDescription("信息技术行业，风险较低");
        rt1.setSource("系统自动评估");
        riskTagRepository.save(rt1);

        RiskTag rt2 = new RiskTag();
        rt2.setApplication(app1);
        rt2.setTagName("注册资本");
        rt2.setRiskLevel(RiskLevel.LOW);
        rt2.setDescription("注册资本500万，规模适中");
        rt2.setSource("系统自动评估");
        riskTagRepository.save(rt2);

        AccountApplication app2 = new AccountApplication();
        app2.setApplicationNo("KH202501020002");
        app2.setEnterprise(e2);
        app2.setBranch(branch2);
        app2.setStatus(ApplicationStatus.MATERIAL_DEFICIENT);
        app2.setAccountType("一般存款账户");
        app2.setReturnReason("受益人身份证明材料缺失");
        app2.setCustomerManagerName("李四");
        app2.setCustomerManagerPhone("13800138002");
        app2.setOperationStaffName("王五");
        app2.setSubmitTime(LocalDateTime.now().minusDays(5));
        app2.setOperationVerifyTime(LocalDateTime.now().minusDays(3));
        app2.setRemark("受益人材料缺失样本");
        applicationRepository.save(app2);

        addMaterialsForBeneficiaryDeficient(app2);
        addHistoryRecord(app2, ApplicationStatus.DRAFT, ApplicationStatus.PENDING_OPERATION, "提交申请", "李四", "客户经理", "提交开户申请");
        addHistoryRecord(app2, ApplicationStatus.PENDING_OPERATION, ApplicationStatus.MATERIAL_DEFICIENT, "材料缺失退回", "王五", "运营人员", "受益人身份证明材料缺失，需补充所有受益所有人的身份证复印件及受益所有人证明文件");

        RiskTag rt3 = new RiskTag();
        rt3.setApplication(app2);
        rt3.setTagName("受益所有人识别");
        rt3.setRiskLevel(RiskLevel.MEDIUM);
        rt3.setDescription("需补充受益所有人信息");
        rt3.setSource("人工审核");
        riskTagRepository.save(rt3);

        AccountApplication app3 = new AccountApplication();
        app3.setApplicationNo("KH202501030003");
        app3.setEnterprise(e4);
        app3.setBranch(branch2);
        app3.setStatus(ApplicationStatus.ADDRESS_VERIFICATION_FAILED);
        app3.setAccountType("基本存款账户");
        app3.setReturnReason("地址核验失败");
        app3.setCustomerManagerName("李四");
        app3.setCustomerManagerPhone("13800138002");
        app3.setOperationStaffName("王五");
        app3.setSubmitTime(LocalDateTime.now().minusDays(4));
        app3.setOperationVerifyTime(LocalDateTime.now().minusDays(2));
        app3.setRemark("地址核验失败样本");
        applicationRepository.save(app3);

        addMaterialsForAddressFailed(app3);
        addHistoryRecord(app3, ApplicationStatus.DRAFT, ApplicationStatus.PENDING_OPERATION, "提交申请", "李四", "客户经理", "提交开户申请");
        addHistoryRecord(app3, ApplicationStatus.PENDING_OPERATION, ApplicationStatus.ADDRESS_VERIFICATION_FAILED, "地址核验失败", "王五", "运营人员", "经营地址核验未通过，实际地址与注册地址不符，需重新尽调");

        RiskTag rt4 = new RiskTag();
        rt4.setApplication(app3);
        rt4.setTagName("地址核验失败");
        rt4.setRiskLevel(RiskLevel.HIGH);
        rt4.setDescription("经营地址无法核实，存在风险");
        rt4.setSource("实地核查");
        riskTagRepository.save(rt4);

        AccountApplication app4 = new AccountApplication();
        app4.setApplicationNo("KH202501040004");
        app4.setEnterprise(e3);
        app4.setBranch(branch1);
        app4.setStatus(ApplicationStatus.HIGH_RISK);
        app4.setAccountType("基本存款账户");
        app4.setRiskLevel(RiskLevel.HIGH);
        app4.setRiskComment("金融投资行业，属于高风险行业，需加强尽职调查");
        app4.setCustomerManagerName("张三");
        app4.setCustomerManagerPhone("13800138001");
        app4.setOperationStaffName("王五");
        app4.setRiskControlName("赵六");
        app4.setSubmitTime(LocalDateTime.now().minusDays(7));
        app4.setOperationVerifyTime(LocalDateTime.now().minusDays(5));
        app4.setRiskReviewTime(LocalDateTime.now().minusDays(1));
        app4.setRemark("高风险行业样本");
        applicationRepository.save(app4);

        addMaterialsForHighRisk(app4);
        addHistoryRecord(app4, ApplicationStatus.DRAFT, ApplicationStatus.PENDING_OPERATION, "提交申请", "张三", "客户经理", "提交开户申请");
        addHistoryRecord(app4, ApplicationStatus.PENDING_OPERATION, ApplicationStatus.PENDING_RISK, "材料核验通过", "王五", "运营人员", "材料齐全，核验通过");
        addHistoryRecord(app4, ApplicationStatus.PENDING_RISK, ApplicationStatus.HIGH_RISK, "高风险认定", "赵六", "风控人员", "金融投资行业属于高风险行业，需主管进一步审核");

        RiskTag rt5 = new RiskTag();
        rt5.setApplication(app4);
        rt5.setTagName("高风险行业");
        rt5.setRiskLevel(RiskLevel.HIGH);
        rt5.setDescription("投资与资产管理行业，属于高风险行业");
        rt5.setSource("行业风险名单");
        riskTagRepository.save(rt5);

        RiskTag rt6 = new RiskTag();
        rt6.setApplication(app4);
        rt6.setTagName("注册资本较大");
        rt6.setRiskLevel(RiskLevel.MEDIUM);
        rt6.setDescription("注册资本5000万，需核实资金来源");
        rt6.setSource("系统自动评估");
        riskTagRepository.save(rt6);

        RiskTag rt7 = new RiskTag();
        rt7.setApplication(app4);
        rt7.setTagName("受益所有人结构复杂");
        rt7.setRiskLevel(RiskLevel.MEDIUM);
        rt7.setDescription("需进一步穿透识别最终受益人");
        rt7.setSource("人工审核");
        riskTagRepository.save(rt7);

        AccountApplication app5 = new AccountApplication();
        app5.setApplicationNo("KH202501050005");
        app5.setEnterprise(e1);
        app5.setBranch(branch1);
        app5.setStatus(ApplicationStatus.PENDING_RISK);
        app5.setAccountType("一般存款账户");
        app5.setCustomerManagerName("张三");
        app5.setCustomerManagerPhone("13800138001");
        app5.setOperationStaffName("王五");
        app5.setSubmitTime(LocalDateTime.now().minusDays(2));
        app5.setOperationVerifyTime(LocalDateTime.now().minusDays(1));
        app5.setRemark("待风险复核样本");
        applicationRepository.save(app5);

        addMaterialsForNormal(app5);
        addHistoryRecord(app5, ApplicationStatus.DRAFT, ApplicationStatus.PENDING_OPERATION, "提交申请", "张三", "客户经理", "提交开户申请");
        addHistoryRecord(app5, ApplicationStatus.PENDING_OPERATION, ApplicationStatus.PENDING_RISK, "材料核验通过", "王五", "运营人员", "材料齐全，核验通过");

        log.info("申请数据初始化完成");
    }

    private void addMaterialsForNormal(AccountApplication app) {
        Material m1 = new Material();
        m1.setApplication(app);
        m1.setMaterialType(MaterialType.BUSINESS_LICENSE);
        m1.setMaterialName("营业执照");
        m1.setStatus(MaterialStatus.VERIFIED);
        m1.setSubmitter("张三");
        materialRepository.save(m1);

        Material m2 = new Material();
        m2.setApplication(app);
        m2.setMaterialType(MaterialType.LEGAL_ID_CARD);
        m2.setMaterialName("法人身份证正面");
        m2.setStatus(MaterialStatus.VERIFIED);
        m2.setSubmitter("张三");
        materialRepository.save(m2);

        Material m3 = new Material();
        m3.setApplication(app);
        m3.setMaterialType(MaterialType.LEGAL_ID_CARD_BACK);
        m3.setMaterialName("法人身份证背面");
        m3.setStatus(MaterialStatus.VERIFIED);
        m3.setSubmitter("张三");
        materialRepository.save(m3);

        Material m4 = new Material();
        m4.setApplication(app);
        m4.setMaterialType(MaterialType.BENEFICIARY_ID_CARD);
        m4.setMaterialName("受益人身份证");
        m4.setStatus(MaterialStatus.VERIFIED);
        m4.setSubmitter("张三");
        materialRepository.save(m4);

        Material m5 = new Material();
        m5.setApplication(app);
        m5.setMaterialType(MaterialType.BENEFICIARY_PROOF);
        m5.setMaterialName("受益所有人证明");
        m5.setStatus(MaterialStatus.VERIFIED);
        m5.setSubmitter("张三");
        materialRepository.save(m5);

        Material m6 = new Material();
        m6.setApplication(app);
        m6.setMaterialType(MaterialType.ADDRESS_PROOF);
        m6.setMaterialName("经营地址证明");
        m6.setStatus(MaterialStatus.VERIFIED);
        m6.setSubmitter("张三");
        materialRepository.save(m6);

        Material m7 = new Material();
        m7.setApplication(app);
        m7.setMaterialType(MaterialType.ARTICLES_OF_ASSOCIATION);
        m7.setMaterialName("公司章程");
        m7.setStatus(MaterialStatus.VERIFIED);
        m7.setSubmitter("张三");
        materialRepository.save(m7);
    }

    private void addMaterialsForBeneficiaryDeficient(AccountApplication app) {
        Material m1 = new Material();
        m1.setApplication(app);
        m1.setMaterialType(MaterialType.BUSINESS_LICENSE);
        m1.setMaterialName("营业执照");
        m1.setStatus(MaterialStatus.VERIFIED);
        m1.setSubmitter("李四");
        materialRepository.save(m1);

        Material m2 = new Material();
        m2.setApplication(app);
        m2.setMaterialType(MaterialType.LEGAL_ID_CARD);
        m2.setMaterialName("法人身份证正面");
        m2.setStatus(MaterialStatus.VERIFIED);
        m2.setSubmitter("李四");
        materialRepository.save(m2);

        Material m3 = new Material();
        m3.setApplication(app);
        m3.setMaterialType(MaterialType.LEGAL_ID_CARD_BACK);
        m3.setMaterialName("法人身份证背面");
        m3.setStatus(MaterialStatus.VERIFIED);
        m3.setSubmitter("李四");
        materialRepository.save(m3);

        Material m4 = new Material();
        m4.setApplication(app);
        m4.setMaterialType(MaterialType.BENEFICIARY_ID_CARD);
        m4.setMaterialName("受益人身份证");
        m4.setStatus(MaterialStatus.DEFICIENT);
        m4.setDeficiencyReason("缺少股东刘芳的身份证复印件");
        m4.setSubmitter("李四");
        materialRepository.save(m4);

        Material m5 = new Material();
        m5.setApplication(app);
        m5.setMaterialType(MaterialType.BENEFICIARY_PROOF);
        m5.setMaterialName("受益所有人证明");
        m5.setStatus(MaterialStatus.DEFICIENT);
        m5.setDeficiencyReason("未提供受益所有人持股比例证明文件");
        m5.setSubmitter("李四");
        materialRepository.save(m5);

        Material m6 = new Material();
        m6.setApplication(app);
        m6.setMaterialType(MaterialType.ADDRESS_PROOF);
        m6.setMaterialName("经营地址证明");
        m6.setStatus(MaterialStatus.VERIFIED);
        m6.setSubmitter("李四");
        materialRepository.save(m6);
    }

    private void addMaterialsForAddressFailed(AccountApplication app) {
        Material m1 = new Material();
        m1.setApplication(app);
        m1.setMaterialType(MaterialType.BUSINESS_LICENSE);
        m1.setMaterialName("营业执照");
        m1.setStatus(MaterialStatus.VERIFIED);
        m1.setSubmitter("李四");
        materialRepository.save(m1);

        Material m2 = new Material();
        m2.setApplication(app);
        m2.setMaterialType(MaterialType.LEGAL_ID_CARD);
        m2.setMaterialName("法人身份证");
        m2.setStatus(MaterialStatus.VERIFIED);
        m2.setSubmitter("李四");
        materialRepository.save(m2);

        Material m3 = new Material();
        m3.setApplication(app);
        m3.setMaterialType(MaterialType.ADDRESS_PROOF);
        m3.setMaterialName("经营地址证明");
        m3.setStatus(MaterialStatus.DEFICIENT);
        m3.setDeficiencyReason("地址证明文件与实际地址不符，实地核查发现该地址不存在该企业");
        m3.setSubmitter("李四");
        materialRepository.save(m3);

        Material m4 = new Material();
        m4.setApplication(app);
        m4.setMaterialType(MaterialType.ARTICLES_OF_ASSOCIATION);
        m4.setMaterialName("公司章程");
        m4.setStatus(MaterialStatus.VERIFIED);
        m4.setSubmitter("李四");
        materialRepository.save(m4);
    }

    private void addMaterialsForHighRisk(AccountApplication app) {
        Material m1 = new Material();
        m1.setApplication(app);
        m1.setMaterialType(MaterialType.BUSINESS_LICENSE);
        m1.setMaterialName("营业执照");
        m1.setStatus(MaterialStatus.VERIFIED);
        m1.setSubmitter("张三");
        materialRepository.save(m1);

        Material m2 = new Material();
        m2.setApplication(app);
        m2.setMaterialType(MaterialType.LEGAL_ID_CARD);
        m2.setMaterialName("法人身份证");
        m2.setStatus(MaterialStatus.VERIFIED);
        m2.setSubmitter("张三");
        materialRepository.save(m2);

        Material m3 = new Material();
        m3.setApplication(app);
        m3.setMaterialType(MaterialType.BENEFICIARY_ID_CARD);
        m3.setMaterialName("受益人身份证");
        m3.setStatus(MaterialStatus.VERIFIED);
        m3.setSubmitter("张三");
        materialRepository.save(m3);

        Material m4 = new Material();
        m4.setApplication(app);
        m4.setMaterialType(MaterialType.BENEFICIARY_PROOF);
        m4.setMaterialName("受益所有人证明");
        m4.setStatus(MaterialStatus.VERIFIED);
        m4.setSubmitter("张三");
        materialRepository.save(m4);

        Material m5 = new Material();
        m5.setApplication(app);
        m5.setMaterialType(MaterialType.ADDRESS_PROOF);
        m5.setMaterialName("经营地址证明");
        m5.setStatus(MaterialStatus.VERIFIED);
        m5.setSubmitter("张三");
        materialRepository.save(m5);

        Material m6 = new Material();
        m6.setApplication(app);
        m6.setMaterialType(MaterialType.ARTICLES_OF_ASSOCIATION);
        m6.setMaterialName("公司章程");
        m6.setStatus(MaterialStatus.VERIFIED);
        m6.setSubmitter("张三");
        materialRepository.save(m6);

        Material m7 = new Material();
        m7.setApplication(app);
        m7.setMaterialType(MaterialType.FINANCIAL_REPORT);
        m7.setMaterialName("财务报表");
        m7.setStatus(MaterialStatus.VERIFIED);
        m7.setSubmitter("张三");
        materialRepository.save(m7);
    }

    private void addHistoryRecord(AccountApplication app, ApplicationStatus from, ApplicationStatus to,
                                  String action, String operatorName, String role, String comment) {
        ApplicationHistory history = new ApplicationHistory();
        history.setApplication(app);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setAction(action);
        history.setOperatorName(operatorName);
        history.setOperatorRole(role);
        history.setComment(comment);
        history.setCreateTime(LocalDateTime.now().minusDays(1));
        historyRepository.save(history);
    }
}
