import { Role } from '@hospital/shared';

export interface JwtPayload {
  sub: string;
  role: Role;
}
