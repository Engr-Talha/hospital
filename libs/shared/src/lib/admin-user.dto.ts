import { Role } from './roles';

export interface CreateStaffUserRequest {
  email: string;
  password: string;
  name: string;
  role: Role;
}

/** Returned by GET /admin/users and POST /admin/users */
export interface StaffUserSummary {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}
