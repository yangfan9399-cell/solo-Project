import express from 'express';
import cors from 'cors';
import { PrismaClient, BookingStatus, ConflictType, Role } from '@prisma/client';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

async function getBookingWithRelations(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      meetingRoom: {
        include: {
          equipments: true,
        },
      },
      department: true,
      costAllocations: {
        include: {
          department: true,
        },
      },
      bookingEquipments: true,
      flowRecords: true,
    },
  });
}

async function getAllBookingsWithRelations() {
  return prisma.booking.findMany({
    include: {
      meetingRoom: {
        include: {
          equipments: true,
        },
      },
      department: true,
      costAllocations: {
        include: {
          department: true,
        },
      },
      bookingEquipments: true,
      flowRecords: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async function checkTimeOverlap(
  meetingRoomId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
) {
  return prisma.booking.findFirst({
    where: {
      meetingRoomId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: {
        notIn: ['CANCELLED', 'REJECTED', 'ARCHIVED'],
      },
      OR: [
        {
          startTime: {
            lt: endTime,
          },
          endTime: {
            gt: startTime,
          },
        },
      ],
    },
    include: {
      department: true,
    },
  });
}

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Meeting Room Booking API is running (PostgreSQL mode)', mode: 'prisma' });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed', 
      error: (error as Error).message 
    });
  }
});

app.get('/api/departments', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch departments', 
      details: (error as Error).message 
    });
  }
});

app.get('/api/meeting-rooms', async (req, res) => {
  try {
    const meetingRooms = await prisma.meetingRoom.findMany({
      include: {
        equipments: true,
      },
      orderBy: { floor: 'asc' },
    });
    res.json(meetingRooms);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch meeting rooms', 
      details: (error as Error).message 
    });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await getAllBookingsWithRelations();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch bookings', 
      details: (error as Error).message 
    });
  }
});

app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await getBookingWithRelations(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch booking', 
      details: (error as Error).message 
    });
  }
});

app.get('/api/check-conflict', async (req, res) => {
  try {
    const { meetingRoomId, startTime, endTime, excludeBookingId } = req.query;
    
    if (!meetingRoomId || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Missing required parameters: meetingRoomId, startTime, endTime' 
      });
    }
    
    const start = new Date(startTime as string);
    const end = new Date(endTime as string);
    
    const conflictingBooking = await checkTimeOverlap(
      meetingRoomId as string,
      start,
      end,
      excludeBookingId as string
    );

    if (conflictingBooking) {
      res.json({
        hasConflict: true,
        type: 'TIME_OVERLAP',
        reason: `与"${conflictingBooking.title}"时间重叠，该会议室已被${conflictingBooking.department?.name || '其他部门'}预订`,
        conflictingBooking,
      });
    } else {
      res.json({ hasConflict: false, type: 'NONE', reason: '' });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check conflict', 
      details: (error as Error).message 
    });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const {
      title,
      meetingRoomId,
      departmentId,
      startTime,
      endTime,
      totalCost,
      applicant,
      equipmentNotes,
      selectedEquipments,
      costAllocations: allocations,
      conflictType,
      conflictReason,
      equipmentWarnings,
    } = req.body;

    if (!title || !meetingRoomId || !departmentId || !startTime || !endTime || !applicant) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, meetingRoomId, departmentId, startTime, endTime, applicant' 
      });
    }

    const newBooking = await prisma.booking.create({
      data: {
        title,
        meetingRoomId,
        departmentId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalCost,
        applicant,
        applicantRole: Role.ADMIN,
        equipmentNotes,
        status: conflictType && conflictType !== 'NONE' ? BookingStatus.CONFLICT : BookingStatus.PENDING,
        conflictType: conflictType || ConflictType.NONE,
        conflictReason,
        bookingEquipments: {
          create: selectedEquipments.map((eq: string) => ({
            name: eq,
            available: !equipmentWarnings?.includes(eq),
          })),
        },
        costAllocations: {
          create: allocations.map((alloc: any) => ({
            departmentId: alloc.departmentId,
            amount: alloc.amount,
            percentage: alloc.percentage,
            confirmed: false,
          })),
        },
        flowRecords: {
          create: {
            action: '创建预订',
            operator: applicant,
            role: Role.ADMIN,
            remark: '行政经办人提交预订申请',
          },
        },
      },
      include: {
        meetingRoom: {
          include: {
            equipments: true,
          },
        },
        department: true,
        costAllocations: {
          include: {
            department: true,
          },
        },
        bookingEquipments: true,
        flowRecords: true,
      },
    });

    if (conflictType && conflictType !== 'NONE') {
      await prisma.flowRecord.create({
        data: {
          bookingId: newBooking.id,
          action: '冲突检测',
          operator: '系统',
          role: Role.ADMIN,
          remark: conflictReason || '检测到预订冲突',
        },
      });
    }

    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create booking', 
      details: (error as Error).message 
    });
  }
});

app.put('/api/bookings/:id/confirm-cost', async (req, res) => {
  try {
    const { id } = req.params;
    const { allocationId, confirmedBy } = req.body;

    if (!allocationId || !confirmedBy) {
      return res.status(400).json({ 
        error: 'Missing required fields: allocationId, confirmedBy' 
      });
    }

    const allocation = await prisma.costAllocation.findUnique({
      where: { id: allocationId },
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Cost allocation not found' });
    }

    await prisma.costAllocation.update({
      where: { id: allocationId },
      data: {
        confirmed: true,
        confirmedAt: new Date(),
        confirmedBy,
      },
    });

    await prisma.flowRecord.create({
      data: {
        bookingId: id,
        action: '费用确认',
        operator: confirmedBy,
        role: Role.DEPARTMENT_HEAD,
        remark: '费用分摊已确认',
      },
    });

    const booking = await getBookingWithRelations(id);
    res.json(booking);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to confirm cost', 
      details: (error as Error).message 
    });
  }
});

app.put('/api/bookings/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CONFIRMED,
      },
    });

    await prisma.flowRecord.create({
      data: {
        bookingId: id,
        action: '确认预订',
        operator: '王复核',
        role: Role.REVIEWER,
        remark: '复核通过，预订已确认',
      },
    });

    const updatedBooking = await getBookingWithRelations(id);
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to confirm booking', 
      details: (error as Error).message 
    });
  }
});

app.put('/api/bookings/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.REJECTED,
      },
    });

    await prisma.flowRecord.create({
      data: {
        bookingId: id,
        action: '拒绝预订',
        operator: '王复核',
        role: Role.REVIEWER,
        remark: '预订申请被拒绝',
      },
    });

    const updatedBooking = await getBookingWithRelations(id);
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to reject booking', 
      details: (error as Error).message 
    });
  }
});

app.put('/api/bookings/:id/resolve-conflict', async (req, res) => {
  try {
    const { id } = req.params;
    const { newMeetingRoomId, newStartTime, newEndTime } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== BookingStatus.CONFLICT) {
      return res.status(400).json({ 
        error: 'Booking is not in conflict status',
        currentStatus: booking.status
      });
    }

    const hasNewRoom = newMeetingRoomId && newMeetingRoomId.trim() !== '';
    const hasNewTime = newStartTime && newEndTime && 
                      newStartTime.trim() !== '' && 
                      newEndTime.trim() !== '';

    if (!hasNewRoom && !hasNewTime) {
      return res.status(400).json({ 
        error: 'Must provide either newMeetingRoomId or both newStartTime and newEndTime',
        bookingStatus: booking.status,
        conflictType: booking.conflictType,
        conflictReason: booking.conflictReason
      });
    }

    if (hasNewTime) {
      const start = new Date(newStartTime);
      const end = new Date(newEndTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          error: 'Invalid date format for newStartTime or newEndTime',
          bookingStatus: booking.status,
          conflictType: booking.conflictType,
          conflictReason: booking.conflictReason
        });
      }
      
      if (end <= start) {
        return res.status(400).json({ 
          error: 'newEndTime must be after newStartTime',
          bookingStatus: booking.status,
          conflictType: booking.conflictType,
          conflictReason: booking.conflictReason
        });
      }
    }

    const targetRoomId = hasNewRoom ? newMeetingRoomId : booking.meetingRoomId;
    const targetStartTime = hasNewTime ? new Date(newStartTime) : booking.startTime;
    const targetEndTime = hasNewTime ? new Date(newEndTime) : booking.endTime;

    const overlappingBooking = await checkTimeOverlap(
      targetRoomId,
      targetStartTime,
      targetEndTime,
      id
    );

    if (overlappingBooking) {
      return res.status(400).json({ 
        error: `Time still overlaps with booking: "${overlappingBooking.title}"`,
        overlappingBooking: {
          id: overlappingBooking.id,
          title: overlappingBooking.title,
          startTime: overlappingBooking.startTime,
          endTime: overlappingBooking.endTime
        },
        bookingStatus: booking.status,
        conflictType: booking.conflictType,
        conflictReason: booking.conflictReason
      });
    }

    const updateData: any = {
      status: BookingStatus.PENDING,
      conflictType: ConflictType.NONE,
      conflictReason: null,
    };

    let remark = '';

    if (hasNewRoom) {
      updateData.meetingRoomId = newMeetingRoomId;
      const room = await prisma.meetingRoom.findUnique({
        where: { id: newMeetingRoomId },
      });
      remark = `更换会议室为 ${room?.name}`;
    }

    if (hasNewTime) {
      updateData.startTime = targetStartTime;
      updateData.endTime = targetEndTime;
      remark = `调整时间为 ${targetStartTime.toLocaleString()} - ${targetEndTime.toLocaleTimeString()}`;

      if (hasNewRoom) {
        const room = await prisma.meetingRoom.findUnique({
          where: { id: newMeetingRoomId },
        });
        const hours = (targetEndTime.getTime() - targetStartTime.getTime()) / (1000 * 60 * 60);
        updateData.totalCost = hours * (room?.hourlyRate || 0);
        remark = `更换会议室为 ${room?.name}，调整时间为 ${targetStartTime.toLocaleString()} - ${targetEndTime.toLocaleTimeString()}`;
      }
    }

    await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    await prisma.flowRecord.create({
      data: {
        bookingId: id,
        action: '解决冲突',
        operator: '王复核',
        role: Role.REVIEWER,
        remark,
      },
    });

    const updatedBooking = await getBookingWithRelations(id);
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to resolve conflict', 
      details: (error as Error).message 
    });
  }
});

app.put('/api/bookings/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.ARCHIVED,
      },
    });

    await prisma.flowRecord.create({
      data: {
        bookingId: id,
        action: '归档',
        operator: '王复核',
        role: Role.REVIEWER,
        remark: '预订记录已归档',
      },
    });

    const updatedBooking = await getBookingWithRelations(id);
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to archive booking', 
      details: (error as Error).message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} (PostgreSQL mode)`);
});
