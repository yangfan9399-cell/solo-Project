const API_BASE = 'http://localhost:3001/api';

export async function fetchDepartments() {
  const res = await fetch(`${API_BASE}/departments`);
  return res.json();
}

export async function fetchMeetingRooms() {
  const res = await fetch(`${API_BASE}/meeting-rooms`);
  return res.json();
}

export async function fetchBookings() {
  const res = await fetch(`${API_BASE}/bookings`);
  return res.json();
}

export async function fetchBooking(id: string) {
  const res = await fetch(`${API_BASE}/bookings/${id}`);
  if (!res.ok) throw new Error('Booking not found');
  return res.json();
}

export async function checkConflict(meetingRoomId: string, startTime: string, endTime: string, excludeBookingId?: string) {
  const params = new URLSearchParams({ meetingRoomId, startTime, endTime });
  if (excludeBookingId) params.append('excludeBookingId', excludeBookingId);
  const res = await fetch(`${API_BASE}/check-conflict?${params}`);
  return res.json();
}

export async function createBooking(data: any) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function confirmCost(bookingId: string, allocationId: string, confirmedBy: string) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/confirm-cost`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allocationId, confirmedBy }),
  });
  return res.json();
}

export async function confirmBooking(bookingId: string) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/confirm`, {
    method: 'PUT',
  });
  return res.json();
}

export async function rejectBooking(bookingId: string) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/reject`, {
    method: 'PUT',
  });
  return res.json();
}

export async function resolveConflict(bookingId: string, data: any) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/resolve-conflict`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function archiveBooking(bookingId: string) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/archive`, {
    method: 'PUT',
  });
  return res.json();
}
