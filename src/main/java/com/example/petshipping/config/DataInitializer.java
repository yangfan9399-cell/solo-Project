
package com.example.petshipping.config;

import com.example.petshipping.entity.*;
import com.example.petshipping.enums.BookingStatus;
import com.example.petshipping.enums.PetType;
import com.example.petshipping.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    
    private final FlightRepository flightRepository;
    private final PetRepository petRepository;
    private final OwnerRepository ownerRepository;
    private final QuarantineCertificateRepository certificateRepository;
    private final CrateRepository crateRepository;
    private final BookingRepository bookingRepository;
    private final BookingHistoryRepository historyRepository;
    
    @Override
    public void run(String... args) throws Exception {
        if (flightRepository.count() > 0) {
            return;
        }
        
        createFlights();
        createSampleBookings();
    }
    
    private void createFlights() {
        Flight flight1 = Flight.builder()
                .flightNumber("CA1234")
                .departureCity("北京")
                .arrivalCity("上海")
                .departureTime(LocalDateTime.of(2026, 6, 15, 10, 0))
                .arrivalTime(LocalDateTime.of(2026, 6, 15, 12, 0))
                .airline("中国国航")
                .petCapacity(10)
                .currentPetCount(0)
                .build();
        
        Flight flight2 = Flight.builder()
                .flightNumber("MU5678")
                .departureCity("上海")
                .arrivalCity("广州")
                .departureTime(LocalDateTime.of(2026, 6, 15, 14, 0))
                .arrivalTime(LocalDateTime.of(2026, 6, 15, 16, 30))
                .airline("东方航空")
                .petCapacity(8)
                .currentPetCount(0)
                .build();
        
        Flight flight3 = Flight.builder()
                .flightNumber("CZ3456")
                .departureCity("广州")
                .arrivalCity("深圳")
                .departureTime(LocalDateTime.of(2026, 6, 15, 18, 0))
                .arrivalTime(LocalDateTime.of(2026, 6, 15, 19, 0))
                .airline("南方航空")
                .petCapacity(6)
                .currentPetCount(0)
                .build();
        
        Flight flight4 = Flight.builder()
                .flightNumber("HU7890")
                .departureCity("北京")
                .arrivalCity("广州")
                .departureTime(LocalDateTime.of(2026, 6, 16, 9, 0))
                .arrivalTime(LocalDateTime.of(2026, 6, 16, 12, 30))
                .airline("海南航空")
                .petCapacity(12)
                .currentPetCount(0)
                .build();
        
        flightRepository.save(flight1);
        flightRepository.save(flight2);
        flightRepository.save(flight3);
        flightRepository.save(flight4);
    }
    
    private void createSampleBookings() {
        Flight flight1 = flightRepository.findByFlightNumber("CA1234").orElseThrow();
        Flight flight2 = flightRepository.findByFlightNumber("MU5678").orElseThrow();
        Flight flight3 = flightRepository.findByFlightNumber("CZ3456").orElseThrow();
        
        createNormalBooking(flight1);
        createExpiredCertificateBooking(flight2);
        createInvalidCrateBooking(flight2);
        createRebookedBooking(flight3);
    }
    
    private void createNormalBooking(Flight flight) {
        Pet pet = Pet.builder()
                .name("旺财")
                .petType(PetType.DOG)
                .breed("金毛")
                .age(3)
                .weight(25.0)
                .color("金色")
                .microchipId("CHN123456789")
                .build();
        pet = petRepository.save(pet);
        
        Owner owner = Owner.builder()
                .name("张三")
                .idCard("110101199001011234")
                .phone("13800138001")
                .email("zhangsan@example.com")
                .address("北京市朝阳区xxx街道xxx号")
                .build();
        owner = ownerRepository.save(owner);
        
        QuarantineCertificate certificate = QuarantineCertificate.builder()
                .certificateNumber("QC2026001")
                .issueDate(LocalDate.of(2026, 5, 1))
                .expiryDate(LocalDate.of(2026, 11, 1))
                .issuingAuthority("北京市动物检疫站")
                .vetName("李兽医")
                .isVerified(true)
                .verifiedBy("检疫员小李")
                .verifiedAt(LocalDate.of(2026, 6, 1))
                .build();
        certificate = certificateRepository.save(certificate);
        
        Crate crate = Crate.builder()
                .length(120.0)
                .width(80.0)
                .height(90.0)
                .material("塑料")
                .hasVentilation(true)
                .hasDripTray(true)
                .isApproved(true)
                .checkedBy("交运员小张")
                .build();
        crate = crateRepository.save(crate);
        
        Booking booking = Booking.builder()
                .bookingNumber("BK" + System.currentTimeMillis() + "NML")
                .pet(pet)
                .owner(owner)
                .flight(flight)
                .certificate(certificate)
                .crate(crate)
                .status(BookingStatus.CRATE_APPROVED)
                .createdAt(LocalDateTime.of(2026, 6, 1, 10, 0))
                .createdBy("客服小王")
                .rebookingCount(0)
                .build();
        booking = bookingRepository.save(booking);
        
        flight.setCurrentPetCount(flight.getCurrentPetCount() + 1);
        flightRepository.save(flight);
        
        createHistory(booking, "BOOKING_CREATED", "客服小王", "客服创建预约");
        createHistory(booking, "CERTIFICATE_VERIFIED", "检疫员小李", "检疫证明审核通过");
        createHistory(booking, "CRATE_APPROVED", "交运员小张", "航空箱检查通过");
    }
    
    private void createExpiredCertificateBooking(Flight flight) {
        Pet pet = Pet.builder()
                .name("咪咪")
                .petType(PetType.CAT)
                .breed("英短")
                .age(2)
                .weight(4.5)
                .color("蓝色")
                .microchipId("CHN987654321")
                .build();
        pet = petRepository.save(pet);
        
        Owner owner = Owner.builder()
                .name("李四")
                .idCard("310101198505056789")
                .phone("13900139002")
                .email("lisi@example.com")
                .address("上海市浦东新区xxx路xxx号")
                .build();
        owner = ownerRepository.save(owner);
        
        QuarantineCertificate certificate = QuarantineCertificate.builder()
                .certificateNumber("QC2025002")
                .issueDate(LocalDate.of(2025, 5, 1))
                .expiryDate(LocalDate.of(2025, 11, 1))
                .issuingAuthority("上海市动物检疫站")
                .vetName("王兽医")
                .isVerified(false)
                .build();
        certificate = certificateRepository.save(certificate);
        
        Crate crate = Crate.builder()
                .length(60.0)
                .width(45.0)
                .height(50.0)
                .material("塑料")
                .hasVentilation(true)
                .hasDripTray(true)
                .isApproved(false)
                .build();
        crate = crateRepository.save(crate);
        
        Booking booking = Booking.builder()
                .bookingNumber("BK" + System.currentTimeMillis() + "EXP")
                .pet(pet)
                .owner(owner)
                .flight(flight)
                .certificate(certificate)
                .crate(crate)
                .status(BookingStatus.CERTIFICATE_EXPIRED)
                .createdAt(LocalDateTime.of(2026, 6, 2, 14, 0))
                .createdBy("客服小王")
                .rebookingCount(0)
                .build();
        booking = bookingRepository.save(booking);
        
        flight.setCurrentPetCount(flight.getCurrentPetCount() + 1);
        flightRepository.save(flight);
        
        createHistory(booking, "BOOKING_CREATED", "客服小王", "客服创建预约");
        createHistory(booking, "CERTIFICATE_REJECTED", "检疫员小李", "检疫证明已过期");
    }
    
    private void createInvalidCrateBooking(Flight flight) {
        Pet pet = Pet.builder()
                .name("球球")
                .petType(PetType.DOG)
                .breed("泰迪")
                .age(1)
                .weight(3.0)
                .color("棕色")
                .microchipId("CHN112233445")
                .build();
        pet = petRepository.save(pet);
        
        Owner owner = Owner.builder()
                .name("王五")
                .idCard("440101199203034567")
                .phone("13600136003")
                .email("wangwu@example.com")
                .address("广州市天河区xxx大道xxx号")
                .build();
        owner = ownerRepository.save(owner);
        
        QuarantineCertificate certificate = QuarantineCertificate.builder()
                .certificateNumber("QC2026003")
                .issueDate(LocalDate.of(2026, 6, 1))
                .expiryDate(LocalDate.of(2027, 6, 1))
                .issuingAuthority("广州市动物检疫站")
                .vetName("张兽医")
                .isVerified(true)
                .verifiedBy("检疫员小李")
                .verifiedAt(LocalDate.of(2026, 6, 3))
                .build();
        certificate = certificateRepository.save(certificate);
        
        Crate crate = Crate.builder()
                .length(40.0)
                .width(30.0)
                .height(35.0)
                .material("塑料")
                .hasVentilation(false)
                .hasDripTray(false)
                .isApproved(false)
                .checkedBy("交运员小张")
                .checkNotes("航空箱尺寸不足，缺少通风口和接尿盘")
                .build();
        crate = crateRepository.save(crate);
        
        Booking booking = Booking.builder()
                .bookingNumber("BK" + System.currentTimeMillis() + "CRT")
                .pet(pet)
                .owner(owner)
                .flight(flight)
                .certificate(certificate)
                .crate(crate)
                .status(BookingStatus.CRATE_REJECTED)
                .createdAt(LocalDateTime.of(2026, 6, 3, 9, 0))
                .createdBy("客服小王")
                .rebookingCount(0)
                .build();
        booking = bookingRepository.save(booking);
        
        flight.setCurrentPetCount(flight.getCurrentPetCount() + 1);
        flightRepository.save(flight);
        
        createHistory(booking, "BOOKING_CREATED", "客服小王", "客服创建预约");
        createHistory(booking, "CERTIFICATE_VERIFIED", "检疫员小李", "检疫证明审核通过");
        createHistory(booking, "CRATE_REJECTED", "交运员小张", "航空箱尺寸不足，缺少通风口和接尿盘");
    }
    
    private void createRebookedBooking(Flight flight) {
        Pet pet = Pet.builder()
                .name("豆豆")
                .petType(PetType.BIRD)
                .breed("鹦鹉")
                .age(2)
                .weight(0.5)
                .color("绿色")
                .microchipId("CHN556677889")
                .build();
        pet = petRepository.save(pet);
        
        Owner owner = Owner.builder()
                .name("赵六")
                .idCard("440301198807078901")
                .phone("13700137004")
                .email("zhaoliu@example.com")
                .address("深圳市南山区xxx路xxx号")
                .build();
        owner = ownerRepository.save(owner);
        
        QuarantineCertificate certificate = QuarantineCertificate.builder()
                .certificateNumber("QC2026004")
                .issueDate(LocalDate.of(2026, 5, 15))
                .expiryDate(LocalDate.of(2026, 11, 15))
                .issuingAuthority("深圳市动物检疫站")
                .vetName("陈兽医")
                .isVerified(true)
                .verifiedBy("检疫员小李")
                .verifiedAt(LocalDate.of(2026, 6, 4))
                .build();
        certificate = certificateRepository.save(certificate);
        
        Crate crate = Crate.builder()
                .length(30.0)
                .width(25.0)
                .height(40.0)
                .material("金属")
                .hasVentilation(true)
                .hasDripTray(true)
                .isApproved(true)
                .checkedBy("交运员小张")
                .build();
        crate = crateRepository.save(crate);
        
        Booking booking = Booking.builder()
                .bookingNumber("BK" + System.currentTimeMillis() + "RBK")
                .pet(pet)
                .owner(owner)
                .flight(flight)
                .certificate(certificate)
                .crate(crate)
                .status(BookingStatus.REBOOKING)
                .createdAt(LocalDateTime.of(2026, 6, 4, 11, 0))
                .createdBy("客服小王")
                .rebookingCount(1)
                .build();
        booking = bookingRepository.save(booking);
        
        flight.setCurrentPetCount(flight.getCurrentPetCount() + 1);
        flightRepository.save(flight);
        
        createHistory(booking, "BOOKING_CREATED", "客服小王", "客服创建预约");
        createHistory(booking, "CERTIFICATE_VERIFIED", "检疫员小李", "检疫证明审核通过");
        createHistory(booking, "CRATE_APPROVED", "交运员小张", "航空箱检查通过");
        createHistory(booking, "FLIGHT_REBOOKED", "主管老王", "航班改签：CA9999 -> CZ3456");
    }
    
    private void createHistory(Booking booking, String type, String operator, String notes) {
        historyRepository.save(com.example.petshipping.entity.BookingHistory.builder()
                .booking(booking)
                .historyType(com.example.petshipping.enums.HistoryType.valueOf(type))
                .operator(operator)
                .notes(notes)
                .createdAt(LocalDateTime.now())
                .build());
    }
}
