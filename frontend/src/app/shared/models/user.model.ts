export type UserRole = 'driver' | 'dispatcher' | 'repair_manager' | 'insurance_specialist';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}
