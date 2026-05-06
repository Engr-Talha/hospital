export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum BloodGroup {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-',
  UNKNOWN = 'UNKNOWN',
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  phone?: string;
  address?: string;
  bloodGroup?: BloodGroup;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface PatientRegisteredBySummary {
  id: string;
  name: string;
  email: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dob: string;
  phone?: string | null;
  address?: string | null;
  bloodGroup?: BloodGroup | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  notes?: string | null;
  registeredBy?: PatientRegisteredBySummary | null;
  createdAt: string;
}

export interface PaginatedPatients {
  items: Patient[];
  total: number;
  page: number;
  limit: number;
}
