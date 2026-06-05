import { create } from 'zustand';
import { Booking, BookingStatus, ConflictType, ConflictInfo, Role, CostAllocation, FlowRecord, BookingEquipment } from '../types';
import { bookings as initialBookings, meetingRooms, departments } from '../data/mockData';

interface BookingStore {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  getBookingById: (id: string) => Booking | undefined;
  checkConflict: (meetingRoomId: string, startTime: Date, endTime: Date, excludeBookingId?: string) => ConflictInfo;
  checkEquipmentAvailability: (meetingRoomId: string, requiredEquipments: string[]) => { available: boolean; missing: string[] };
  checkCostAllocation: (allocations: CostAllocation[]) => { valid: boolean; totalPercentage: number };
  confirmCostAllocation: (bookingId: string, allocationId: string, confirmedBy: string) => void;
  addFlowRecord: (bookingId: string, action: string, operator: string, role: Role, remark?: string) => void;
  resolveConflict: (bookingId: string, newMeetingRoomId?: string, newStartTime?: Date, newEndTime?: Date) => void;
  archiveBooking: (bookingId: string) => void;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: initialBookings,

  addBooking: (bookingData) => {
    const newBooking: Booking = {
      ...bookingData,
      id: `booking-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({ bookings: [...state.bookings, newBooking] }));
  },

  updateBooking: (id, updates) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b
      ),
    }));
  },

  deleteBooking: (id) => {
    set((state) => ({
      bookings: state.bookings.filter((b) => b.id !== id),
    }));
  },

  getBookingById: (id) => {
    return get().bookings.find((b) => b.id === id);
  },

  checkConflict: (meetingRoomId, startTime, endTime, excludeBookingId) => {
    const { bookings } = get();
    const conflictingBooking = bookings.find((b) => {
      if (b.meetingRoomId !== meetingRoomId) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      if (b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED) return false;
      
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      const sStart = new Date(startTime).getTime();
      const sEnd = new Date(endTime).getTime();
      
      return (sStart < bEnd && sEnd > bStart);
    });

    if (conflictingBooking) {
      return {
        hasConflict: true,
        type: ConflictType.TIME_OVERLAP,
        reason: `与"${conflictingBooking.title}"时间重叠，该会议室已被预订`,
        conflictingBooking,
      };
    }

    return { hasConflict: false, type: ConflictType.NONE, reason: '' };
  },

  checkEquipmentAvailability: (meetingRoomId, requiredEquipments) => {
    const room = meetingRooms.find((r) => r.id === meetingRoomId);
    if (!room) return { available: false, missing: requiredEquipments };

    const roomEquipments = room.equipments.map((e) => e.name);
    const missing = requiredEquipments.filter((eq) => !roomEquipments.includes(eq));

    return {
      available: missing.length === 0,
      missing,
    };
  },

  checkCostAllocation: (allocations) => {
    const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
    return {
      valid: Math.abs(totalPercentage - 100) < 0.01,
      totalPercentage,
    };
  },

  confirmCostAllocation: (bookingId, allocationId, confirmedBy) => {
    set((state) => ({
      bookings: state.bookings.map((booking) => {
        if (booking.id !== bookingId) return booking;
        return {
          ...booking,
          costAllocations: booking.costAllocations.map((alloc) =>
            alloc.id === allocationId
              ? { ...alloc, confirmed: true, confirmedAt: new Date(), confirmedBy }
              : alloc
          ),
          updatedAt: new Date(),
        };
      }),
    }));
  },

  addFlowRecord: (bookingId, action, operator, role, remark) => {
    const newRecord: FlowRecord = {
      id: `flow-${Date.now()}`,
      bookingId,
      action,
      operator,
      role,
      remark,
      createdAt: new Date(),
    };

    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, flowRecords: [...booking.flowRecords, newRecord], updatedAt: new Date() }
          : booking
      ),
    }));
  },

  resolveConflict: (bookingId, newMeetingRoomId, newStartTime, newEndTime) => {
    const booking = get().bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    const updates: Partial<Booking> = {};
    
    if (newMeetingRoomId) {
      updates.meetingRoomId = newMeetingRoomId;
      updates.meetingRoom = meetingRooms.find((r) => r.id === newMeetingRoomId);
    }
    if (newStartTime) updates.startTime = newStartTime;
    if (newEndTime) updates.endTime = newEndTime;

    const room = meetingRooms.find((r) => r.id === (newMeetingRoomId || booking.meetingRoomId));
    if (room && newStartTime && newEndTime) {
      const hours = (new Date(newEndTime).getTime() - new Date(newStartTime).getTime()) / (1000 * 60 * 60);
      updates.totalCost = hours * room.hourlyRate;
    }

    updates.status = BookingStatus.PENDING;
    updates.conflictType = ConflictType.NONE;
    updates.conflictReason = undefined;

    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, ...updates, updatedAt: new Date() } : b
      ),
    }));
  },

  archiveBooking: (bookingId) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId
          ? { ...b, status: BookingStatus.ARCHIVED, updatedAt: new Date() }
          : b
      ),
    }));
  },
}));

export { meetingRooms, departments };
