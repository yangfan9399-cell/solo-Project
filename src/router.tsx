import { createBrowserRouter, LoaderFunctionArgs, ActionFunctionArgs, redirect } from 'react-router-dom';
import App from './App';
import BookingList from './pages/BookingList';
import BookingDetail from './pages/BookingDetail';
import NewBooking from './pages/NewBooking';
import Dashboard from './pages/Dashboard';
import { fetchBookings, fetchBooking, createBooking, confirmCost, confirmBooking, rejectBooking, resolveConflict, archiveBooking, fetchMeetingRooms, fetchDepartments, checkConflict } from './api/client';

export async function listLoader() {
  const bookings = await fetchBookings();
  return { bookings };
}

export async function detailLoader({ params }: LoaderFunctionArgs) {
  const booking = await fetchBooking(params.id!);
  const meetingRooms = await fetchMeetingRooms();
  return { booking, meetingRooms };
}

export async function newBookingLoader() {
  const meetingRooms = await fetchMeetingRooms();
  const departments = await fetchDepartments();
  return { meetingRooms, departments };
}

export async function dashboardLoader() {
  const bookings = await fetchBookings();
  const meetingRooms = await fetchMeetingRooms();
  const departments = await fetchDepartments();
  return { bookings, meetingRooms, departments };
}

export async function newBookingAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());
  
  const selectedEquipments = JSON.parse(data.selectedEquipments as string);
  const costAllocations = JSON.parse(data.costAllocations as string);
  const equipmentWarnings = JSON.parse(data.equipmentWarnings as string);
  
  const startDateTime = `${data.date}T${data.startTime}`;
  const endDateTime = `${data.date}T${data.endTime}`;

  const conflict = await checkConflict(data.meetingRoomId as string, startDateTime, endDateTime);

  let finalConflictType = 'NONE';
  let conflictReason = '';

  if (conflict.hasConflict) {
    finalConflictType = 'TIME_OVERLAP';
    conflictReason = conflict.reason;
  } else if (equipmentWarnings.length > 0) {
    finalConflictType = 'EQUIPMENT_MISSING';
    conflictReason = `缺少设备: ${equipmentWarnings.join(', ')}`;
  } else if (costAllocations.reduce((sum: number, c: any) => sum + Number(c.percentage), 0) !== 100) {
    finalConflictType = 'COST_ALLOCATION_MISMATCH';
    conflictReason = `费用分摊比例总和不足100%`;
  }

  await createBooking({
    title: data.title,
    meetingRoomId: data.meetingRoomId,
    departmentId: data.departmentId,
    startTime: startDateTime,
    endTime: endDateTime,
    totalCost: Number(data.totalCost),
    applicant: data.applicant,
    equipmentNotes: data.equipmentNotes,
    selectedEquipments,
    costAllocations: costAllocations.map((c: any) => ({
      ...c,
      amount: (Number(data.totalCost) * Number(c.percentage)) / 100,
    })),
    conflictType: finalConflictType,
    conflictReason,
    equipmentWarnings,
  });

  return redirect('/');
}

export async function detailAction({ params, request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('action') as string;
  const bookingId = params.id!;

  try {
    switch (action) {
      case 'confirmCost':
        await confirmCost(bookingId, formData.get('allocationId') as string, formData.get('confirmedBy') as string);
        break;
      case 'confirm':
        await confirmBooking(bookingId);
        break;
      case 'reject':
        await rejectBooking(bookingId);
        break;
      case 'resolveConflict':
        const resolveData: any = {};
        if (formData.get('newMeetingRoomId')) {
          resolveData.newMeetingRoomId = formData.get('newMeetingRoomId');
        }
        if (formData.get('newStartTime') && formData.get('newEndTime')) {
          resolveData.newStartTime = `${formData.get('newDate')}T${formData.get('newStartTime')}`;
          resolveData.newEndTime = `${formData.get('newDate')}T${formData.get('newEndTime')}`;
        }
        const resolveResult = await resolveConflict(bookingId, resolveData);
        if (!resolveResult.ok) {
          const errorData = await resolveResult.json();
          return { 
            success: false, 
            action: 'resolveConflict', 
            error: errorData.error,
            details: errorData
          };
        }
        break;
      case 'archive':
        await archiveBooking(bookingId);
        break;
    }

    return redirect(`/booking/${bookingId}`);
  } catch (error) {
    return { 
      success: false, 
      action, 
      error: (error as Error).message 
    };
  }
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <BookingList />,
        loader: listLoader,
      },
      {
        path: 'booking/new',
        element: <NewBooking />,
        loader: newBookingLoader,
        action: newBookingAction,
      },
      {
        path: 'booking/:id',
        element: <BookingDetail />,
        loader: detailLoader,
        action: detailAction,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
        loader: dashboardLoader,
      },
    ],
  },
]);
