import { Permission } from './permissions';
import { Role } from './roles';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
