package com.hospital.film.config;

import com.hospital.film.dto.FilmReissueCreateDTO;
import com.hospital.film.dto.ProcessDTO;
import com.hospital.film.dto.ReviewDTO;
import com.hospital.film.entity.ApplicationHistory;
import com.hospital.film.entity.FilmReissue;
import com.hospital.film.enums.*;
import com.hospital.film.repository.ApplicationHistoryRepository;
import com.hospital.film.repository.FilmReissueRepository;
import com.hospital.film.service.FilmReissueService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final FilmReissueService filmReissueService;
    private final FilmReissueRepository filmReissueRepository;
    private final ApplicationHistoryRepository historyRepository;

    public DataInitializer(FilmReissueService filmReissueService,
                            FilmReissueRepository filmReissueRepository,
                            ApplicationHistoryRepository historyRepository) {
        this.filmReissueService = filmReissueService;
        this.filmReissueRepository = filmReissueRepository;
        this.historyRepository = historyRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (filmReissueRepository.count() > 0) {
            return;
        }

        createNormalCase();
        createMaterialMissingCase();
        createResponsibilityMismatchCase();
        createReviewRejectCase();
    }

    private void createNormalCase() {
        FilmReissueCreateDTO createDTO = new FilmReissueCreateDTO();
        createDTO.setSource(ApplicationSource.OUTPATIENT);
        createDTO.setPatientName("张伟");
        createDTO.setIdCardNo("310101199001011234");
        createDTO.setMedicalRecordNo("MZ202401001");
        createDTO.setExamNo("CT20240115001");
        createDTO.setExamItem("胸部CT平扫");
        createDTO.setExamTime(LocalDateTime.now().minusDays(7));
        createDTO.setExamDepartment("放射科");
        createDTO.setFilmType("干式激光胶片");
        createDTO.setFilmCount(2);
        createDTO.setFeeAmount(new BigDecimal("50.00"));
        createDTO.setFeeReceiptNo("SF20240115001");
        createDTO.setResponsibleParty("患者本人");
        createDTO.setApplicationReason("胶片丢失，需补打");
        createDTO.setApplicant("张伟");
        createDTO.setRemark("患者自述胶片在家中不慎遗失");

        FilmReissue film = filmReissueService.createApplication(createDTO);

        ProcessDTO processDTO = new ProcessDTO();
        processDTO.setPatientName("张伟");
        processDTO.setMedicalRecordNo("MZ202401001");
        processDTO.setExamNo("CT20240115001");
        processDTO.setExamItem("胸部CT平扫");
        processDTO.setExamTime(LocalDateTime.now().minusDays(7));
        processDTO.setExamDepartment("放射科");
        processDTO.setFilmType("干式激光胶片");
        processDTO.setFilmCount(2);
        processDTO.setFeeAmount(new BigDecimal("50.00"));
        processDTO.setFeeReceiptNo("SF20240115001");
        processDTO.setFeePayTime(LocalDateTime.now().minusDays(1));
        processDTO.setResponsibleParty("患者本人");
        processDTO.setApplicationReason("胶片丢失，需补打");
        processDTO.setConclusion("材料齐全，符合补打条件，同意补打2张胶片");
        processDTO.setEvidenceBasis("1. 患者身份证明有效；2. 收费票据核对无误；3. PACS系统存在检查记录");
        processDTO.setDescription("经核查，患者身份属实，收费记录完整，PACS系统可查影像，符合补打规定");
        processDTO.setOperator("张经办");
        processDTO.setAbnormalType("NORMAL");

        filmReissueService.processApplication(film.getId(), processDTO);
        filmReissueService.submitForReview(film.getId(), "张经办");

        ReviewDTO reviewDTO = new ReviewDTO();
        reviewDTO.setConclusion("复核通过，同意补打申请");
        reviewDTO.setEvidenceBasis("1. 经办人处理规范；2. 材料完整有效；3. 费用核对无误");
        reviewDTO.setDescription("经复核，处理流程规范，材料齐全，结论正确");
        reviewDTO.setOperator("王复核");

        filmReissueService.reviewPass(film.getId(), reviewDTO);

        film = filmReissueService.findById(film.getId());
        film.setReceiver("张伟");
        film.setReceiveTime(LocalDateTime.now().minusHours(2));
        filmReissueRepository.save(film);
    }

    private void createMaterialMissingCase() {
        FilmReissueCreateDTO createDTO = new FilmReissueCreateDTO();
        createDTO.setSource(ApplicationSource.INPATIENT);
        createDTO.setPatientName("李芳");
        createDTO.setIdCardNo("310101198505055678");
        createDTO.setMedicalRecordNo("ZY202402001");
        createDTO.setExamNo("MR20240220001");
        createDTO.setExamItem("头颅MRI平扫+增强");
        createDTO.setExamTime(LocalDateTime.now().minusDays(14));
        createDTO.setExamDepartment("神经内科");
        createDTO.setFilmType("干式激光胶片");
        createDTO.setFilmCount(3);
        createDTO.setFeeAmount(new BigDecimal("75.00"));
        createDTO.setResponsibleParty("患者家属");
        createDTO.setApplicationReason("出院结算后需胶片用于复诊");
        createDTO.setApplicant("李明（家属）");
        createDTO.setRemark("患者儿子代办，称住院期间未领取胶片");

        FilmReissue film = filmReissueService.createApplication(createDTO);

        ProcessDTO processDTO = new ProcessDTO();
        processDTO.setPatientName("李芳");
        processDTO.setMedicalRecordNo("ZY202402001");
        processDTO.setExamNo("MR20240220001");
        processDTO.setExamItem("头颅MRI平扫+增强");
        processDTO.setExamTime(LocalDateTime.now().minusDays(14));
        processDTO.setExamDepartment("神经内科");
        processDTO.setFilmType("干式激光胶片");
        processDTO.setFilmCount(3);
        processDTO.setFeeAmount(new BigDecimal("75.00"));
        processDTO.setResponsibleParty("患者家属");
        processDTO.setApplicationReason("出院结算后需胶片用于复诊");
        processDTO.setConclusion("材料不齐，暂无法办理，需补充材料");
        processDTO.setEvidenceBasis("1. 家属身份证明有效；2. 缺少患者本人授权委托书；3. 缺少原始收费凭证");
        processDTO.setBlockReason("关键材料缺失：缺少患者本人签字的授权委托书、原始收费票据存根");
        processDTO.setRemedyPath("1. 补充患者本人签字的授权委托书；2. 提供住院结算清单或收费票据复印件加盖财务章；3. 携带代办人身份证原件");
        processDTO.setDescription("核查发现材料不完整，家属无法提供患者授权委托书和收费凭证原件");
        processDTO.setOperator("张经办");
        processDTO.setAbnormalType("MATERIAL_MISSING");

        filmReissueService.processApplication(film.getId(), processDTO);
    }

    private void createResponsibilityMismatchCase() {
        FilmReissueCreateDTO createDTO = new FilmReissueCreateDTO();
        createDTO.setSource(ApplicationSource.EMERGENCY);
        createDTO.setPatientName("王强");
        createDTO.setIdCardNo("310101199203039012");
        createDTO.setMedicalRecordNo("JZ202403001");
        createDTO.setExamNo("XR20240310001");
        createDTO.setExamItem("胸部正位片");
        createDTO.setExamTime(LocalDateTime.now().minusDays(5));
        createDTO.setExamDepartment("急诊科");
        createDTO.setFilmType("干式激光胶片");
        createDTO.setFilmCount(1);
        createDTO.setFeeAmount(new BigDecimal("25.00"));
        createDTO.setFeeReceiptNo("SF20240310002");
        createDTO.setResponsibleParty("患者单位");
        createDTO.setApplicationReason("工伤报销需要补打胶片");
        createDTO.setApplicant("王强");
        createDTO.setRemark("患者称因工伤需要提供胶片作为报销凭证");

        FilmReissue film = filmReissueService.createApplication(createDTO);

        ProcessDTO processDTO = new ProcessDTO();
        processDTO.setPatientName("王强");
        processDTO.setMedicalRecordNo("JZ202403001");
        processDTO.setExamNo("XR20240310001");
        processDTO.setExamItem("胸部正位片");
        processDTO.setExamTime(LocalDateTime.now().minusDays(5));
        processDTO.setExamDepartment("急诊科");
        processDTO.setFilmType("干式激光胶片");
        processDTO.setFilmCount(1);
        processDTO.setFeeAmount(new BigDecimal("25.00"));
        processDTO.setFeeReceiptNo("SF20240310002");
        processDTO.setFeePayTime(LocalDateTime.now().minusDays(5));
        processDTO.setResponsibleParty("患者本人");
        processDTO.setApplicationReason("工伤报销需要补打胶片");
        processDTO.setConclusion("责任对象不一致，需进一步核实费用承担方");
        processDTO.setEvidenceBasis("1. 申请单填写责任方为患者单位；2. 系统记录费用由个人支付；3. 无工伤认定相关材料");
        processDTO.setBlockReason("责任对象不一致：申请单填写为患者单位承担，但系统记录为个人自费支付，且无工伤认定证明");
        processDTO.setRemedyPath("1. 提供工伤认定书原件；2. 提供单位同意承担费用的证明文件；3. 由单位经办人携带单位介绍信办理");
        processDTO.setDescription("经核查，申请单与系统记录的费用承担方不一致，且缺少工伤相关证明材料");
        processDTO.setOperator("张经办");
        processDTO.setAbnormalType("RESPONSIBILITY_MISMATCH");

        filmReissueService.processApplication(film.getId(), processDTO);
    }

    private void createReviewRejectCase() {
        FilmReissueCreateDTO createDTO = new FilmReissueCreateDTO();
        createDTO.setSource(ApplicationSource.PHYSICAL_EXAM);
        createDTO.setPatientName("陈静");
        createDTO.setIdCardNo("310101198808083456");
        createDTO.setMedicalRecordNo("TJ202404001");
        createDTO.setExamNo("CT20240405001");
        createDTO.setExamItem("胸部CT体检");
        createDTO.setExamTime(LocalDateTime.now().minusDays(20));
        createDTO.setExamDepartment("体检中心");
        createDTO.setFilmType("干式激光胶片");
        createDTO.setFilmCount(2);
        createDTO.setFeeAmount(new BigDecimal("50.00"));
        createDTO.setFeeReceiptNo("TJ20240405001");
        createDTO.setResponsibleParty("体检单位");
        createDTO.setApplicationReason("体检报告需附胶片");
        createDTO.setApplicant("陈静");
        createDTO.setRemark("单位组织体检，个人需要胶片");

        FilmReissue film = filmReissueService.createApplication(createDTO);

        ProcessDTO processDTO = new ProcessDTO();
        processDTO.setPatientName("陈静");
        processDTO.setMedicalRecordNo("TJ202404001");
        processDTO.setExamNo("CT20240405001");
        processDTO.setExamItem("胸部CT体检");
        processDTO.setExamTime(LocalDateTime.now().minusDays(20));
        processDTO.setExamDepartment("体检中心");
        processDTO.setFilmType("干式激光胶片");
        processDTO.setFilmCount(2);
        processDTO.setFeeAmount(new BigDecimal("50.00"));
        processDTO.setFeeReceiptNo("TJ20240405001");
        processDTO.setFeePayTime(LocalDateTime.now().minusDays(20));
        processDTO.setResponsibleParty("体检单位");
        processDTO.setApplicationReason("体检报告需附胶片");
        processDTO.setConclusion("材料齐全，同意补打，费用已交");
        processDTO.setEvidenceBasis("1. 患者身份证明有效；2. 体检中心有记录；3. 费用已缴纳");
        processDTO.setDescription("经核查，材料基本齐全，同意办理补打");
        processDTO.setOperator("张经办");
        processDTO.setAbnormalType("NORMAL");

        filmReissueService.processApplication(film.getId(), processDTO);
        filmReissueService.submitForReview(film.getId(), "张经办");

        ReviewDTO reviewDTO = new ReviewDTO();
        reviewDTO.setConclusion("复核不通过，退回补充");
        reviewDTO.setEvidenceBasis("1. 体检胶片补打政策规定需单位同意；2. 缺少单位介绍信或同意补打证明；3. 费用性质需要进一步确认");
        reviewDTO.setRejectReason("体检类补打缺少单位同意证明，且费用承担方需进一步核实。根据医院规定，团体体检的胶片补打需经体检中心确认并提供单位同意证明。");
        reviewDTO.setRemedyPath("1. 联系体检中心出具补打确认单；2. 提供单位同意补打的证明文件；3. 确认费用是个人支付还是单位支付");
        reviewDTO.setDescription("复核发现体检类补打申请材料不完整，缺少单位证明，退回经办人补充材料");
        reviewDTO.setOperator("王复核");

        filmReissueService.reviewReject(film.getId(), reviewDTO);
    }
}
