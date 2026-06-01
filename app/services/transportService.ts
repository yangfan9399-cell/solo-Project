import { db } from "~/db";
import type { TransportRecord } from "~/types";

export function getTransportsByLoanId(loanId: number): TransportRecord[] {
  return db
    .prepare("SELECT * FROM transport_records WHERE loan_id = ? ORDER BY created_at DESC")
    .all(loanId) as TransportRecord[];
}

export function getTransportById(id: number): TransportRecord | undefined {
  return db.prepare("SELECT * FROM transport_records WHERE id = ?").get(id) as
    | TransportRecord
    | undefined;
}

export function createTransportRecord(
  data: Omit<TransportRecord, "id" | "created_at" | "updated_at">
): number {
  const stmt = db.prepare(
    `INSERT INTO transport_records (loan_id, transport_type, carrier, vehicle_number, driver_name, driver_phone, departure_location, destination, scheduled_departure, scheduled_arrival, actual_departure, actual_arrival, escort_name, escort_phone, security_measures, status, remarks) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.loan_id,
    data.transport_type,
    data.carrier,
    data.vehicle_number,
    data.driver_name,
    data.driver_phone,
    data.departure_location,
    data.destination,
    data.scheduled_departure,
    data.scheduled_arrival,
    data.actual_departure,
    data.actual_arrival,
    data.escort_name,
    data.escort_phone,
    data.security_measures,
    data.status,
    data.remarks
  );
  return result.lastInsertRowid as number;
}

export function updateTransportRecord(
  id: number,
  data: Partial<Omit<TransportRecord, "id" | "created_at" | "updated_at">>
): void {
  const setClauses = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(data), id];
  db
    .prepare(`UPDATE transport_records SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values);
}
