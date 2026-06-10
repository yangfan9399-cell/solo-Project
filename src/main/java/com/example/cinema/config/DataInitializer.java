
package com.example.cinema.config;

import com.example.cinema.entity.*;
import com.example.cinema.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private CinemaRepository cinemaRepository;

    @Autowired
    private HallRepository hallRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private ScreeningRepository screeningRepository;

    @Autowired
    private InspectionRecordRepository inspectionRecordRepository;

    @Autowired
    private InterruptRecordRepository interruptRecordRepository;

    @Autowired
    private CompensationRecordRepository compensationRecordRepository;

    @Override
    public void run(String... args) throws Exception {
        if (cinemaRepository.count() > 0) {
            return;
        }

        Cinema cinema = new Cinema();
        cinema.setName("星光影城");
        cinema.setAddress("北京市朝阳区建国路88号");
        cinema.setPhone("010-12345678");
        cinema = cinemaRepository.save(cinema);

        Hall hall1 = new Hall();
        hall1.setCinema(cinema);
        hall1.setName("1号厅");
        hall1.setCapacity(100);
        hall1.setEquipmentStatus(EquipmentStatus.NORMAL);
        hall1 = hallRepository.save(hall1);

        Hall hall2 = new Hall();
        hall2.setCinema(cinema);
        hall2.setName("2号厅");
        hall2.setCapacity(80);
        hall2.setEquipmentStatus(EquipmentStatus.NORMAL);
        hall2 = hallRepository.save(hall2);

        Movie movie1 = new Movie();
        movie1.setTitle("流浪地球2");
        movie1.setOriginalTitle("The Wandering Earth II");
        movie1.setDirector("郭帆");
        movie1.setActors("吴京, 刘德华, 李雪健");
        movie1.setDuration(173);
        movie1.setGenre("科幻/冒险");
        movie1.setRating("PG-13");
        movie1.setReleaseDate(LocalDate.of(2023, 1, 22));
        movie1.setSynopsis("太阳即将毁灭，人类在地球表面建造出巨大的推进器，寻找新的家园。");
        movie1 = movieRepository.save(movie1);

        Movie movie2 = new Movie();
        movie2.setTitle("满江红");
        movie2.setOriginalTitle("Full River Red");
        movie2.setDirector("张艺谋");
        movie2.setActors("沈腾, 易烊千玺, 张译");
        movie2.setDuration(159);
        movie2.setGenre("悬疑/喜剧");
        movie2.setRating("PG-13");
        movie2.setReleaseDate(LocalDate.of(2023, 1, 22));
        movie2.setSynopsis("南宋绍兴年间，一群义士铲奸除恶的故事。");
        movie2 = movieRepository.save(movie2);

        LocalDateTime today = LocalDateTime.now().toLocalDate().atStartOfDay();

        Screening screening1 = new Screening();
        screening1.setHall(hall1);
        screening1.setMovie(movie1);
        screening1.setStartTime(today.plusHours(10));
        screening1.setEndTime(today.plusHours(10).plusMinutes(173));
        screening1.setPrice(new BigDecimal("50"));
        screening1.setTotalSeats(100);
        screening1.setAvailableSeats(80);
        screening1.setIsSelling(true);
        screening1.setStatus(ScreeningStatus.COMPLETED);
        screening1 = screeningRepository.save(screening1);

        Screening screening2 = new Screening();
        screening2.setHall(hall1);
        screening2.setMovie(movie1);
        screening2.setStartTime(today.plusHours(14));
        screening2.setEndTime(today.plusHours(14).plusMinutes(173));
        screening2.setPrice(new BigDecimal("60"));
        screening2.setTotalSeats(100);
        screening2.setAvailableSeats(60);
        screening2.setIsSelling(true);
        screening2.setStatus(ScreeningStatus.INSPECTED);
        screening2 = screeningRepository.save(screening2);

        Screening screening3 = new Screening();
        screening3.setHall(hall2);
        screening3.setMovie(movie2);
        screening3.setStartTime(today.plusHours(11));
        screening3.setEndTime(today.plusHours(11).plusMinutes(159));
        screening3.setPrice(new BigDecimal("45"));
        screening3.setTotalSeats(80);
        screening3.setAvailableSeats(40);
        screening3.setIsSelling(false);
        screening3.setStatus(ScreeningStatus.INTERRUPTED);
        screening3 = screeningRepository.save(screening3);

        Screening screening4 = new Screening();
        screening4.setHall(hall2);
        screening4.setMovie(movie2);
        screening4.setStartTime(today.plusHours(15));
        screening4.setEndTime(today.plusHours(15).plusMinutes(159));
        screening4.setPrice(new BigDecimal("55"));
        screening4.setTotalSeats(80);
        screening4.setAvailableSeats(75);
        screening4.setIsSelling(false);
        screening4.setStatus(ScreeningStatus.SCHEDULED);
        screening4 = screeningRepository.save(screening4);

        InspectionRecord inspection1 = new InspectionRecord();
        inspection1.setScreening(screening1);
        inspection1.setInspectorName("王经理");
        inspection1.setInspectionTime(today.plusHours(9).plusMinutes(30));
        inspection1.setProjectorStatus(EquipmentStatus.NORMAL);
        inspection1.setAudioStatus(EquipmentStatus.NORMAL);
        inspection1.setLightingStatus(EquipmentStatus.NORMAL);
        inspection1.setAirConditioningStatus(EquipmentStatus.NORMAL);
        inspection1.setSeatingStatus(EquipmentStatus.NORMAL);
        inspection1.setRemarks("设备状态良好，可正常放映");
        inspectionRecordRepository.save(inspection1);

        InspectionRecord inspection2 = new InspectionRecord();
        inspection2.setScreening(screening2);
        inspection2.setInspectorName("王经理");
        inspection2.setInspectionTime(today.plusHours(13).plusMinutes(30));
        inspection2.setProjectorStatus(EquipmentStatus.NORMAL);
        inspection2.setAudioStatus(EquipmentStatus.NORMAL);
        inspection2.setLightingStatus(EquipmentStatus.NORMAL);
        inspection2.setAirConditioningStatus(EquipmentStatus.NORMAL);
        inspection2.setSeatingStatus(EquipmentStatus.NORMAL);
        inspection2.setRemarks("设备状态良好");
        inspectionRecordRepository.save(inspection2);

        InspectionRecord inspection3 = new InspectionRecord();
        inspection3.setScreening(screening3);
        inspection3.setInspectorName("王经理");
        inspection3.setInspectionTime(today.plusHours(10).plusMinutes(30));
        inspection3.setProjectorStatus(EquipmentStatus.NORMAL);
        inspection3.setAudioStatus(EquipmentStatus.ABNORMAL);
        inspection3.setLightingStatus(EquipmentStatus.NORMAL);
        inspection3.setAirConditioningStatus(EquipmentStatus.NORMAL);
        inspection3.setSeatingStatus(EquipmentStatus.NORMAL);
        inspection3.setRemarks("音响设备存在杂音，已通知工程师处理");
        inspectionRecordRepository.save(inspection3);

        InterruptRecord interrupt1 = new InterruptRecord();
        interrupt1.setScreening(screening3);
        interrupt1.setReporterName("李放映员");
        interrupt1.setInterruptTime(today.plusHours(11).plusMinutes(45));
        interrupt1.setFaultType(FaultType.AUDIO);
        interrupt1.setFaultDescription("放映过程中音响突然出现严重杂音，影响观影体验，已立即停止放映");
        interrupt1.setIsResolved(false);
        interrupt1 = interruptRecordRepository.save(interrupt1);

        InterruptRecord interrupt2 = new InterruptRecord();
        interrupt2.setScreening(screening1);
        interrupt2.setReporterName("张放映员");
        interrupt2.setInterruptTime(today.plusHours(10).plusMinutes(30));
        interrupt2.setResumeTime(today.plusHours(10).plusMinutes(45));
        interrupt2.setFaultType(FaultType.PROJECTOR);
        interrupt2.setFaultDescription("放映机短暂卡帧，已快速修复");
        interrupt2.setIsResolved(true);
        interrupt2.setResolutionNote("重启放映机后恢复正常");
        interruptRecordRepository.save(interrupt2);

        CompensationRecord compensation1 = new CompensationRecord();
        compensation1.setInterruptRecord(interrupt1);
        compensation1.setAffectedAudienceCount(40);
        compensation1.setCompensationAmount(new BigDecimal("1800"));
        compensation1.setCompensationType("退票+赠券");
        compensation1.setSubmitterName("赵客服");
        compensation1.setSubmitTime(today.plusHours(12));
        compensation1.setStatus(CompensationStatus.PENDING);
        compensationRecordRepository.save(compensation1);

        CompensationRecord compensation2 = new CompensationRecord();
        compensation2.setInterruptRecord(interrupt2);
        compensation2.setAffectedAudienceCount(80);
        compensation2.setCompensationAmount(new BigDecimal("400"));
        compensation2.setCompensationType("赠券");
        compensation2.setSubmitterName("赵客服");
        compensation2.setSubmitTime(today.plusHours(11));
        compensation2.setReviewerName("孙主管");
        compensation2.setReviewTime(today.plusHours(12));
        compensation2.setReviewNote("补偿合理，同意发放");
        compensation2.setStatus(CompensationStatus.COMPLETED);
        compensation2.setIsArchived(true);
        compensation2.setArchivedAt(today.plusHours(15));
        compensationRecordRepository.save(compensation2);

        hall2.setEquipmentStatus(EquipmentStatus.FAULT);
        hallRepository.save(hall2);

        System.out.println("Sample data initialized successfully!");
    }
}
