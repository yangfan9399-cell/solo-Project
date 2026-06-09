package com.fire.inspection.config;

import com.fire.inspection.entity.*;
import com.fire.inspection.enums.*;
import com.fire.inspection.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FireHazardRepository fireHazardRepository;
    private final HazardHistoryRepository hazardHistoryRepository;
    private final RectificationRepository rectificationRepository;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            initUsers();
        }
        if (fireHazardRepository.count() == 0) {
            initHazards();
        }
    }

    private void initUsers() {
        User inspector1 = new User();
        inspector1.setUsername("inspector1");
        inspector1.setRealName("张三");
        inspector1.setRole(UserRole.INSPECTOR);
        inspector1.setPhone("13800138001");
        inspector1.setDepartment("安全巡查组");
        userRepository.save(inspector1);

        User inspector2 = new User();
        inspector2.setUsername("inspector2");
        inspector2.setRealName("李四");
        inspector2.setRole(UserRole.INSPECTOR);
        inspector2.setPhone("13800138002");
        inspector2.setDepartment("安全巡查组");
        userRepository.save(inspector2);

        User deptHead1 = new User();
        deptHead1.setUsername("depthead1");
        deptHead1.setRealName("王五");
        deptHead1.setRole(UserRole.DEPARTMENT_HEAD);
        deptHead1.setPhone("13900139001");
        deptHead1.setDepartment("物业管理部");
        userRepository.save(deptHead1);

        User deptHead2 = new User();
        deptHead2.setUsername("depthead2");
        deptHead2.setRealName("赵六");
        deptHead2.setRole(UserRole.DEPARTMENT_HEAD);
        deptHead2.setPhone("13900139002");
        deptHead2.setDepartment("设施维护部");
        userRepository.save(deptHead2);

        User director1 = new User();
        director1.setUsername("director1");
        director1.setRealName("钱七");
        director1.setRole(UserRole.SAFETY_DIRECTOR);
        director1.setPhone("13700137001");
        director1.setDepartment("安全管理部");
        userRepository.save(director1);

        User director2 = new User();
        director2.setUsername("director2");
        director2.setRealName("孙八");
        director2.setRole(UserRole.SAFETY_DIRECTOR);
        director2.setPhone("13700137002");
        director2.setDepartment("安全管理部");
        userRepository.save(director2);
    }

    private void initHazards() {
        User inspector1 = userRepository.findByUsername("inspector1").orElse(null);
        User deptHead1 = userRepository.findByUsername("depthead1").orElse(null);
        User deptHead2 = userRepository.findByUsername("depthead2").orElse(null);
        User director1 = userRepository.findByUsername("director1").orElse(null);

        if (inspector1 == null || deptHead1 == null || deptHead2 == null || director1 == null) {
            return;
        }

        FireHazard hazard1 = createNormalAcceptedHazard(inspector1, deptHead1, director1);
        FireHazard hazard2 = createFireExtinguisherExpiredHazard(inspector1, deptHead2);
        FireHazard hazard3 = createChannelBlockageHazard(inspector1, deptHead1);
        FireHazard hazard4 = createOverdueHazard(inspector1, deptHead2);

        fireHazardRepository.save(hazard1);
        fireHazardRepository.save(hazard2);
        fireHazardRepository.save(hazard3);
        fireHazardRepository.save(hazard4);
    }

    private FireHazard createNormalAcceptedHazard(User inspector, User deptHead, User director) {
        FireHazard hazard = new FireHazard();
        hazard.setTitle("A栋3楼应急照明故障");
        hazard.setDescription("A栋3楼东侧楼梯口应急照明灯不亮，检查发现是灯泡损坏。");
        hazard.setLevel(HazardLevel.MEDIUM);
        hazard.setCategory(HazardCategory.EMERGENCY_LIGHT);
        hazard.setStatus(HazardStatus.ACCEPTED);
        hazard.setBuilding("A栋");
        hazard.setFloor("3楼");
        hazard.setLocation("东侧楼梯口");
        hazard.setPhotoUrl("/images/emergency-light.jpg");
        hazard.setInspector(inspector);
        hazard.setResponsibleDepartmentHead(deptHead);
        hazard.setResponsibleDepartment("设施维护部");
        hazard.setCreatedAt(LocalDateTime.now().minusDays(5));
        hazard.setUpdatedAt(LocalDateTime.now().minusDays(1));
        hazard.setDeadline(LocalDateTime.now().plusDays(2));
        hazard.setRectifiedAt(LocalDateTime.now().minusDays(2));
        hazard.setAcceptedAt(LocalDateTime.now().minusDays(1));
        hazard.setOverdue(false);
        hazard.setEscalated(false);
        hazard.setRemark("已更换新的应急照明灯具，测试正常。");

        FireHazard saved = fireHazardRepository.save(hazard);

        HazardHistory h1 = new HazardHistory();
        h1.setHazard(saved);
        h1.setToStatus(HazardStatus.REGISTERED);
        h1.setOperator(inspector);
        h1.setRemark("隐患登记：应急照明故障");
        h1.setCreatedAt(saved.getCreatedAt());
        hazardHistoryRepository.save(h1);

        HazardHistory h2 = new HazardHistory();
        h2.setHazard(saved);
        h2.setFromStatus(HazardStatus.REGISTERED);
        h2.setToStatus(HazardStatus.RECTIFYING);
        h2.setOperator(deptHead);
        h2.setRemark("分配责任部门：设施维护部");
        h2.setCreatedAt(saved.getCreatedAt().plusHours(2));
        hazardHistoryRepository.save(h2);

        HazardHistory h3 = new HazardHistory();
        h3.setHazard(saved);
        h3.setFromStatus(HazardStatus.RECTIFYING);
        h3.setToStatus(HazardStatus.RECTIFIED);
        h3.setOperator(deptHead);
        h3.setRemark("提交整改申请：已更换应急照明灯");
        h3.setCreatedAt(saved.getRectifiedAt());
        hazardHistoryRepository.save(h3);

        HazardHistory h4 = new HazardHistory();
        h4.setHazard(saved);
        h4.setFromStatus(HazardStatus.RECTIFIED);
        h4.setToStatus(HazardStatus.ACCEPTED);
        h4.setOperator(director);
        h4.setRemark("验收通过，隐患销项。整改合格，灯具工作正常。");
        h4.setCreatedAt(saved.getAcceptedAt());
        hazardHistoryRepository.save(h4);

        Rectification rect = new Rectification();
        rect.setHazard(saved);
        rect.setDescription("已更换损坏的应急照明灯泡，更换后测试正常。同时对整层楼的应急照明进行了巡检，其他灯具工作正常。");
        rect.setRectificationPhotoUrl("/images/rectified-light.jpg");
        rect.setRectifier(deptHead);
        rect.setRectifiedAt(saved.getRectifiedAt());
        rect.setCreatedAt(saved.getRectifiedAt());
        rectificationRepository.save(rect);

        return saved;
    }

    private FireHazard createFireExtinguisherExpiredHazard(User inspector, User deptHead) {
        FireHazard hazard = new FireHazard();
        hazard.setTitle("B栋1楼灭火器过期");
        hazard.setDescription("B栋1楼大厅左侧3具干粉灭火器已过期，压力不足，需要立即更换。");
        hazard.setLevel(HazardLevel.HIGH);
        hazard.setCategory(HazardCategory.FIRE_EXTINGUISHER);
        hazard.setStatus(HazardStatus.RECTIFYING);
        hazard.setBuilding("B栋");
        hazard.setFloor("1楼");
        hazard.setLocation("大厅左侧");
        hazard.setPhotoUrl("/images/extinguisher.jpg");
        hazard.setInspector(inspector);
        hazard.setResponsibleDepartmentHead(deptHead);
        hazard.setResponsibleDepartment("物业管理部");
        hazard.setCreatedAt(LocalDateTime.now().minusDays(2));
        hazard.setUpdatedAt(LocalDateTime.now().minusDays(1));
        hazard.setDeadline(LocalDateTime.now().plusDays(5));
        hazard.setOverdue(false);
        hazard.setEscalated(false);
        hazard.setRemark("过期灭火器共3具，型号MFZ/ABC4。");

        FireHazard saved = fireHazardRepository.save(hazard);

        HazardHistory h1 = new HazardHistory();
        h1.setHazard(saved);
        h1.setToStatus(HazardStatus.REGISTERED);
        h1.setOperator(inspector);
        h1.setRemark("隐患登记：灭火器过期");
        h1.setCreatedAt(saved.getCreatedAt());
        hazardHistoryRepository.save(h1);

        HazardHistory h2 = new HazardHistory();
        h2.setHazard(saved);
        h2.setFromStatus(HazardStatus.REGISTERED);
        h2.setToStatus(HazardStatus.RECTIFYING);
        h2.setOperator(deptHead);
        h2.setRemark("分配责任部门：物业管理部");
        h2.setCreatedAt(saved.getCreatedAt().plusHours(4));
        hazardHistoryRepository.save(h2);

        return saved;
    }

    private FireHazard createChannelBlockageHazard(User inspector, User deptHead) {
        FireHazard hazard = new FireHazard();
        hazard.setTitle("C栋2楼消防通道被货物占用");
        hazard.setDescription("C栋2楼西侧消防通道被堆放的纸箱和货物占用，影响疏散通道畅通。");
        hazard.setLevel(HazardLevel.HIGH);
        hazard.setCategory(HazardCategory.CHANNEL_BLOCKAGE);
        hazard.setStatus(HazardStatus.RECTIFIED);
        hazard.setBuilding("C栋");
        hazard.setFloor("2楼");
        hazard.setLocation("西侧消防通道");
        hazard.setPhotoUrl("/images/channel-block.jpg");
        hazard.setInspector(inspector);
        hazard.setResponsibleDepartmentHead(deptHead);
        hazard.setResponsibleDepartment("物业管理部");
        hazard.setCreatedAt(LocalDateTime.now().minusDays(3));
        hazard.setUpdatedAt(LocalDateTime.now().minusHours(6));
        hazard.setDeadline(LocalDateTime.now().plusDays(2));
        hazard.setRectifiedAt(LocalDateTime.now().minusHours(6));
        hazard.setOverdue(false);
        hazard.setEscalated(false);
        hazard.setRemark("通道宽度约1.5米，被占用后仅余0.5米。");

        FireHazard saved = fireHazardRepository.save(hazard);

        HazardHistory h1 = new HazardHistory();
        h1.setHazard(saved);
        h1.setToStatus(HazardStatus.REGISTERED);
        h1.setOperator(inspector);
        h1.setRemark("隐患登记：消防通道占用");
        h1.setCreatedAt(saved.getCreatedAt());
        hazardHistoryRepository.save(h1);

        HazardHistory h2 = new HazardHistory();
        h2.setHazard(saved);
        h2.setFromStatus(HazardStatus.REGISTERED);
        h2.setToStatus(HazardStatus.RECTIFYING);
        h2.setOperator(deptHead);
        h2.setRemark("分配责任部门：物业管理部");
        h2.setCreatedAt(saved.getCreatedAt().plusHours(1));
        hazardHistoryRepository.save(h2);

        HazardHistory h3 = new HazardHistory();
        h3.setHazard(saved);
        h3.setFromStatus(HazardStatus.RECTIFYING);
        h3.setToStatus(HazardStatus.RECTIFIED);
        h3.setOperator(deptHead);
        h3.setRemark("提交整改申请：已清理通道杂物");
        h3.setCreatedAt(saved.getRectifiedAt());
        hazardHistoryRepository.save(h3);

        Rectification rect = new Rectification();
        rect.setHazard(saved);
        rect.setDescription("已通知相关部门将通道内的货物和纸箱全部清理，现已恢复通道畅通。同时对相关人员进行了消防安全教育。");
        rect.setRectificationPhotoUrl("/images/channel-cleared.jpg");
        rect.setRectifier(deptHead);
        rect.setRectifiedAt(saved.getRectifiedAt());
        rect.setCreatedAt(saved.getRectifiedAt());
        rectificationRepository.save(rect);

        return saved;
    }

    private FireHazard createOverdueHazard(User inspector, User deptHead) {
        FireHazard hazard = new FireHazard();
        hazard.setTitle("D栋地下室消防栓漏水");
        hazard.setDescription("D栋地下停车场西侧消防栓接口处漏水，水流量较大，需立即维修。");
        hazard.setLevel(HazardLevel.CRITICAL);
        hazard.setCategory(HazardCategory.FIRE_HYDRANT);
        hazard.setStatus(HazardStatus.OVERDUE);
        hazard.setBuilding("D栋");
        hazard.setFloor("地下一层");
        hazard.setLocation("西侧停车场");
        hazard.setPhotoUrl("/images/hydrant-leak.jpg");
        hazard.setInspector(inspector);
        hazard.setResponsibleDepartmentHead(deptHead);
        hazard.setResponsibleDepartment("设施维护部");
        hazard.setCreatedAt(LocalDateTime.now().minusDays(10));
        hazard.setUpdatedAt(LocalDateTime.now().minusDays(2));
        hazard.setDeadline(LocalDateTime.now().minusDays(2));
        hazard.setOverdue(true);
        hazard.setEscalated(true);
        hazard.setRemark("漏水严重，已影响周围墙面。原计划3天内完成维修，现已超期。");

        FireHazard saved = fireHazardRepository.save(hazard);

        HazardHistory h1 = new HazardHistory();
        h1.setHazard(saved);
        h1.setToStatus(HazardStatus.REGISTERED);
        h1.setOperator(inspector);
        h1.setRemark("隐患登记：消防栓漏水");
        h1.setCreatedAt(saved.getCreatedAt());
        hazardHistoryRepository.save(h1);

        HazardHistory h2 = new HazardHistory();
        h2.setHazard(saved);
        h2.setFromStatus(HazardStatus.REGISTERED);
        h2.setToStatus(HazardStatus.RECTIFYING);
        h2.setOperator(deptHead);
        h2.setRemark("分配责任部门：设施维护部，整改期限3天");
        h2.setCreatedAt(saved.getCreatedAt().plusHours(3));
        hazardHistoryRepository.save(h2);

        HazardHistory h3 = new HazardHistory();
        h3.setHazard(saved);
        h3.setFromStatus(HazardStatus.RECTIFYING);
        h3.setToStatus(HazardStatus.OVERDUE);
        h3.setOperator(deptHead);
        h3.setRemark("系统检测：整改超期，已升级处理。因维修配件未到货导致延误。");
        h3.setCreatedAt(saved.getDeadline().plusHours(1));
        hazardHistoryRepository.save(h3);

        return saved;
    }
}
