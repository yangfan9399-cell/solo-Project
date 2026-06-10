
package com.example.cinema.repository;

import com.example.cinema.entity.Screening;
import com.example.cinema.entity.ScreeningStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScreeningRepository extends JpaRepository<Screening, Long> {
    List<Screening> findByHallId(Long hallId);
    List<Screening> findByHallIdOrderByStartTime(Long hallId);
    List<Screening> findByHallIdAndStartTimeAfterOrderByStartTime(Long hallId, LocalDateTime startTime);
    List<Screening> findByStatus(ScreeningStatus status);
    List<Screening> findByHallCinemaId(Long cinemaId);
    
    @Query("SELECT s FROM Screening s WHERE s.hall.id = :hallId AND s.startTime >= :startTime ORDER BY s.startTime")
    List<Screening> findUpcomingScreeningsByHall(@Param("hallId") Long hallId, @Param("startTime") LocalDateTime startTime);
    
    @Query("SELECT s FROM Screening s JOIN FETCH s.hall h JOIN FETCH s.movie m WHERE s.status = :status ORDER BY s.startTime DESC")
    List<Screening> findWithHallAndMovieByStatus(@Param("status") ScreeningStatus status);
    
    @Query("SELECT s FROM Screening s JOIN FETCH s.hall h JOIN FETCH s.movie m ORDER BY s.startTime DESC")
    List<Screening> findAllWithHallAndMovie();
}
