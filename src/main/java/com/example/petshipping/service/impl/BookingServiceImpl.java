
package com.example.petshipping.service.impl;

import com.example.petshipping.entity.*;
import com.example.petshipping.enums.BookingStatus;
import com.example.petshipping.enums.HistoryType;
import com.example.petshipping.repository.*;
import com.example.petshipping.service.BookingService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingServiceImpl implements BookingService {
    
    private final BookingRepository bookingRepository;
    private final BookingHistoryRepository bookingHistoryRepository;
    private final PetRepository petRepository;
    private final OwnerRepository ownerRepository;
    private final FlightRepository flightRepository;
    private final QuarantineCertificateRepository certificateRepository;
    private final CrateRepository crateRepository;
    
    @Override
    @Transactional
    public Booking createBooking(Pet pet, Owner owner, Flight flight, QuarantineCertificate certificate, Crate crate, String createdBy) {
        pet = petRepository.save(pet);
        owner = ownerRepository.save(owner);
        flight = flightRepository.save(flight);
        certificate = certificateRepository.save(certificate);
        crate = crateRepository.save(crate);
        
        Booking booking = Booking.builder()
                .bookingNumber(generateBookingNumber())
                .pet(pet)
                .owner(owner)
                .flight(flight)
                .certificate(certificate)
                .crate(crate)
                .status(BookingStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .createdBy(createdBy)
                .build();
        
        booking = bookingRepository.save(booking);
        
        createHistory(booking, HistoryType.BOOKING_CREATED, createdBy, "客服创建预约");
        
        flight.setCurrentPetCount(flight.getCurrentPetCount() + 1);
        flightRepository.save(flight);
        
        return booking;
    }
    
    @Override
    @Transactional
    public void verifyCertificate(Long bookingId, String operator) {
        Booking booking = bookingRepository.findByIdWithAllRelations(bookingId);
        if (booking == null) {
            throw new EntityNotFoundException("预约不存在");
        }
        
        QuarantineCertificate certificate = booking.getCertificate();
        
        if (certificate.isExpired()) {
            booking.setStatus(BookingStatus.CERTIFICATE_EXPIRED);
            bookingRepository.save(booking);
            createHistory(booking, HistoryType.CERTIFICATE_REJECTED, operator, "检疫证明已过期");
            return;
        }
        
        certificate.setIsVerified(true);
        certificate.setVerifiedBy(operator);
        certificate.setVerifiedAt(java.time.LocalDate.now());
        certificateRepository.save(certificate);
        
        booking.setStatus(BookingStatus.CERTIFICATE_VERIFIED);
        bookingRepository.save(booking);
        
        createHistory(booking, HistoryType.CERTIFICATE_VERIFIED, operator, "检疫证明审核通过");
    }
    
    @Override
    @Transactional
    public void rejectCertificate(Long bookingId, String operator, String reason) {
        Booking booking = bookingRepository.findByIdWithAllRelations(bookingId);
        if (booking == null) {
            throw new EntityNotFoundException("预约不存在");
        }
        
        booking.setStatus(BookingStatus.CERTIFICATE_EXPIRED);
        bookingRepository.save(booking);
        
        createHistory(booking, HistoryType.CERTIFICATE_REJECTED, operator, reason);
    }
    
    @Override
    @Transactional
    public void approveCrate(Long bookingId, String operator) {
        Booking booking = bookingRepository.findByIdWithAllRelations(bookingId);
        if (booking == null) {
            throw new EntityNotFoundException("预约不存在");
        }
        
        if (!booking.getStatus().equals(BookingStatus.CERTIFICATE_VERIFIED)) {
            throw new IllegalStateException("必须先完成检疫证明审核");
        }
        
        Crate crate = booking.getCrate();
        Pet pet = booking.getPet();
        
        StringBuilder validationErrors = new StringBuilder();
        double petWeight = pet.getWeight();
        double crateVolume = crate.getLength() * crate.getWidth() * crate.getHeight();
        double requiredVolume = petWeight * 3000;
        
        if (crateVolume < requiredVolume) {
            validationErrors.append(String.format("箱体体积不足（当前%.0fcm³，要求至少%.0fcm³）；", crateVolume, requiredVolume));
        }
        
        if (!Boolean.TRUE.equals(crate.getHasVentilation())) {
            validationErrors.append("缺少通风口；");
        }
        
        if (!Boolean.TRUE.equals(crate.getHasDripTray())) {
            validationErrors.append("缺少接尿盘；");
        }
        
        if (validationErrors.length() > 0) {
            crate.setIsApproved(false);
            crate.setCheckedBy(operator);
            crate.setCheckNotes(validationErrors.toString());
            crateRepository.save(crate);
            
            booking.setStatus(BookingStatus.CRATE_REJECTED);
            bookingRepository.save(booking);
            
            createHistory(booking, HistoryType.CRATE_REJECTED, operator, validationErrors.toString());
            
            throw new IllegalStateException("航空箱不合规：" + validationErrors);
        }
        
        crate.setIsApproved(true);
        crate.setCheckedBy(operator);
        crateRepository.save(crate);
        
        booking.setStatus(BookingStatus.CRATE_APPROVED);
        bookingRepository.save(booking);
        
        createHistory(booking, HistoryType.CRATE_APPROVED, operator, "航空箱检查通过");
    }
    
    @Override
    @Transactional
    public void rejectCrate(Long bookingId, String operator, String reason) {
        Booking booking = bookingRepository.findByIdWithAllRelations(bookingId);
        if (booking == null) {
            throw new EntityNotFoundException("预约不存在");
        }
        
        Crate crate = booking.getCrate();
        crate.setIsApproved(false);
        crate.setCheckedBy(operator);
        crate.setCheckNotes(reason);
        crateRepository.save(crate);
        
        booking.setStatus(BookingStatus.CRATE_REJECTED);
        bookingRepository.save(booking);
        
        createHistory(booking, HistoryType.CRATE_REJECTED, operator, reason);
    }
    
    @Override
    @Transactional
    public void checkIn(Long bookingId, String operator) {
        Booking booking = bookingRepository.findByIdWithAllRelations(bookingId);
        if (booking == null) {
            throw new EntityNotFoundException("预约不存在");
        }
        
        if (!canCheckIn(bookingId)) {
            throw new IllegalStateException("无法交运：检疫证明过期或状态不允许");
        }
        
        booking.setStatus(BookingStatus.CHECKED_IN);
        bookingRepository.save(booking);
        
        createHistory(booking, HistoryType.CHECKED_IN, operator, "航班交运完成");
    }
    
    @Override
    @Transactional
    public void rebookFlight(Long bookingId, Flight newFlight, String operator) {
        Booking booking = bookingRepository.findByIdWithAllRelations(bookingId);
        if (booking == null) {
            throw new EntityNotFoundException("预约不存在");
        }
        
        Flight oldFlight = booking.getFlight();
        oldFlight.setCurrentPetCount(oldFlight.getCurrentPetCount() - 1);
        flightRepository.save(oldFlight);
        
        newFlight = flightRepository.save(newFlight);
        
        booking.setFlight(newFlight);
        booking.setStatus(BookingStatus.REBOOKING);
        booking.setRebookingCount(booking.getRebookingCount() + 1);
        bookingRepository.save(booking);
        
        newFlight.setCurrentPetCount(newFlight.getCurrentPetCount() + 1);
        flightRepository.save(newFlight);
        
        createHistory(booking, HistoryType.FLIGHT_REBOOKED, operator, 
                String.format("航班改签：%s -> %s", oldFlight.getFlightNumber(), newFlight.getFlightNumber()));
    }
    
    @Override
    @Transactional
    public void cancelBooking(Long bookingId, String operator) {
        Booking booking = bookingRepository.findByIdWithAllRelations(bookingId);
        if (booking == null) {
            throw new EntityNotFoundException("预约不存在");
        }
        
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        
        Flight flight = booking.getFlight();
        flight.setCurrentPetCount(flight.getCurrentPetCount() - 1);
        flightRepository.save(flight);
        
        createHistory(booking, HistoryType.BOOKING_CANCELLED, operator, "取消预约");
    }
    
    @Override
    public Booking findById(Long id) {
        return bookingRepository.findByIdWithAllRelations(id);
    }
    
    @Override
    public List<Booking> findAll() {
        return bookingRepository.findAllWithAllRelations();
    }
    
    @Override
    public List<Booking> findByStatus(BookingStatus status) {
        return bookingRepository.findByStatusWithAllRelations(status);
    }
    
    @Override
    public List<BookingHistory> getBookingHistory(Long bookingId) {
        return bookingHistoryRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
    }
    
    @Override
    public boolean canCheckIn(Long bookingId) {
        Booking booking = bookingRepository.findByIdWithAllRelations(bookingId);
        if (booking == null) {
            return false;
        }
        
        if (booking.getCertificate().isExpired()) {
            return false;
        }
        
        return booking.getStatus().equals(BookingStatus.CRATE_APPROVED);
    }
    
    private String generateBookingNumber() {
        return "BK" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }
    
    private void createHistory(Booking booking, HistoryType type, String operator, String notes) {
        BookingHistory history = BookingHistory.builder()
                .booking(booking)
                .historyType(type)
                .operator(operator)
                .notes(notes)
                .createdAt(LocalDateTime.now())
                .build();
        bookingHistoryRepository.save(history);
    }
}
