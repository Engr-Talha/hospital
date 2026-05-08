import { Role } from './roles';

export enum Permission {
  PATIENT_VIEW = 'PATIENT_VIEW',
  PATIENT_REGISTER = 'PATIENT_REGISTER',
  PATIENT_REGISTRATION_PRINT = 'PATIENT_REGISTRATION_PRINT',
  PATIENT_EDIT_ALL = 'PATIENT_EDIT_ALL',
  PATIENT_DELETE = 'PATIENT_DELETE',
  FEE_LINE_MANAGE = 'FEE_LINE_MANAGE',
  FEE_CATALOG_VIEW = 'FEE_CATALOG_VIEW',
  FEE_CATALOG_ADMIN = 'FEE_CATALOG_ADMIN',
  DASHBOARD_ADMIN = 'DASHBOARD_ADMIN',
  DASHBOARD_RECEPTION = 'DASHBOARD_RECEPTION',
  DASHBOARD_LAB = 'DASHBOARD_LAB',
  DASHBOARD_DOCTOR = 'DASHBOARD_DOCTOR',
  USER_ADMIN = 'USER_ADMIN',
}

const ALL_PERMISSIONS = Object.values(Permission) as Permission[];

export function permissionsForRole(role: Role): Permission[] {
  switch (role) {
    case Role.ADMIN:
      return [...ALL_PERMISSIONS];
    case Role.RECEPTIONIST:
      return [
        Permission.PATIENT_VIEW,
        Permission.PATIENT_REGISTER,
        Permission.PATIENT_REGISTRATION_PRINT,
        Permission.FEE_LINE_MANAGE,
        Permission.FEE_CATALOG_VIEW,
        Permission.DASHBOARD_RECEPTION,
      ];
    case Role.LAB_TECH:
      return [
        Permission.PATIENT_VIEW,
        Permission.FEE_CATALOG_VIEW,
        Permission.DASHBOARD_LAB,
      ];
    case Role.DOCTOR:
      return [
        Permission.PATIENT_VIEW,
        Permission.DASHBOARD_LAB,
        Permission.DASHBOARD_DOCTOR,
      ];
    default:
      return [];
  }
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}
