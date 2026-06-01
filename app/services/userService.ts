import { db } from "~/db";
import type { User } from "~/types";

export function getAllUsers(): User[] {
  return db.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as User[];
}

export function getUserById(id: number): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function getUsersByRole(role: string): User[] {
  return db.prepare("SELECT * FROM users WHERE role = ? ORDER BY name").all(role) as User[];
}

export function createUser(data: Omit<User, "id" | "created_at">): number {
  const stmt = db.prepare(
    "INSERT INTO users (name, role, email, phone, department) VALUES (?, ?, ?, ?, ?)"
  );
  const result = stmt.run(data.name, data.role, data.email, data.phone, data.department);
  return result.lastInsertRowid as number;
}
