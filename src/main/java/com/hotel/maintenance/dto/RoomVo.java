package com.hotel.maintenance.dto;

import com.hotel.maintenance.entity.Room;
import com.hotel.maintenance.enums.RoomStatus;
import lombok.Data;

@Data
public class RoomVo {
    private Long id;
    private String roomNumber;
    private Integer floor;
    private String roomType;
    private Integer capacity;
    private Double pricePerNight;
    private String priceStr;
    private String location;
    private String status;
    private String statusClass;
    private String statusDesc;
    private boolean available;

    public static RoomVo from(Room room) {
        RoomVo vo = new RoomVo();
        vo.setId(room.getId());
        vo.setRoomNumber(room.getRoomNumber());
        vo.setFloor(room.getFloor());
        vo.setRoomType(room.getRoomType());
        vo.setCapacity(room.getCapacity());
        vo.setPricePerNight(room.getPricePerNight());
        vo.setLocation(room.getLocation());

        RoomStatus status = room.getStatus();
        vo.setStatus(status.name());
        vo.setAvailable(status == RoomStatus.AVAILABLE);
        vo.setStatusDesc(status.getDescription());
        vo.setStatusClass(buildStatusClass(status));

        if (room.getPricePerNight() != null) {
            vo.setPriceStr("¥" + room.getPricePerNight().intValue() + "/晚");
        } else {
            vo.setPriceStr("-");
        }
        return vo;
    }

    private static String buildStatusClass(RoomStatus status) {
        switch (status) {
            case AVAILABLE:
                return "bg-success";
            case OUT_OF_SERVICE:
                return "bg-secondary";
            case UNDER_REPAIR:
                return "bg-warning text-dark";
            case CLEANING_PENDING:
                return "bg-warning";
            case CLEANING_DONE:
                return "bg-info";
            case REVIEW_PENDING:
                return "bg-primary";
            default:
                return "bg-secondary";
        }
    }
}
