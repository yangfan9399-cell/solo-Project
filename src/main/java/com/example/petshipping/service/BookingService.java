
package com.example.petshipping.service;

import com.example.petshipping.entity.*;
import com.example.petshipping.enums.BookingStatus;

import java.util.List;

public interface BookingService {
    Booking createBooking(Pet pet, Owner owner, Flight flight, QuarantineCertificate certificate, Crate crate, String createdBy);
    
    void verifyCertificate(Long bookingId, String operator);
    
    void rejectCertificate(Long bookingId, String operator, String reason);
    
    void approveCrate(Long bookingId, String operator);
    
    void rejectCrate(Long bookingId, String operator, String reason);
    
    void checkIn(Long bookingId, String operator);
    
    void rebookFlight(Long bookingId, Flight newFlight, String operator);
    
    void cancelBooking(Long bookingId, String operator);
    
    Booking findById(Long id);
    
    List<Booking> findAll();
    
    List<Booking> findByStatus(BookingStatus status);
    
    List<BookingHistory> getBookingHistory(Long bookingId);
    
    boolean canCheckIn(Long bookingId);
}
