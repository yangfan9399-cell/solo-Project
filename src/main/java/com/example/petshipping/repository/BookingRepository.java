
package com.example.petshipping.repository;

import com.example.petshipping.entity.Booking;
import com.example.petshipping.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByStatus(BookingStatus status);
    
    List<Booking> findByBookingNumberContaining(String bookingNumber);
    
    @Query("SELECT b FROM Booking b JOIN FETCH b.pet JOIN FETCH b.owner JOIN FETCH b.flight JOIN FETCH b.certificate JOIN FETCH b.crate WHERE b.id = :id")
    Booking findByIdWithAllRelations(@Param("id") Long id);
    
    @Query("SELECT b FROM Booking b JOIN FETCH b.pet JOIN FETCH b.owner JOIN FETCH b.flight JOIN FETCH b.certificate JOIN FETCH b.crate")
    List<Booking> findAllWithAllRelations();
    
    @Query("SELECT b FROM Booking b JOIN FETCH b.pet JOIN FETCH b.owner JOIN FETCH b.flight JOIN FETCH b.certificate JOIN FETCH b.crate WHERE b.status = :status")
    List<Booking> findByStatusWithAllRelations(@Param("status") BookingStatus status);
}
