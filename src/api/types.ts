// Tipos de los datos que devuelve la API de CAPS.

export type Role = 'PATIENT' | 'PROFESSIONAL' | 'APPOINTMENT_MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
export type AppointmentStatus = 'CONFIRMED' | 'CANCELLED';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  professionalId: string | null;
  canManageOwnAvailability: boolean;
}

export interface Specialty {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface SpecialtyRef {
  id: string;
  name: string;
}

export interface PublicProfessional {
  id: string;
  firstName: string;
  lastName: string;
  specialties: SpecialtyRef[];
}

export interface ManagedProfessional {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string | null;
  isActive: boolean;
  allowAvailabilityManagement: boolean;
  hasLinkedAccount: boolean;
  pendingInvitationExpiresAt: string | null;
  specialties: (SpecialtyRef & { isActive: boolean })[];
}

export interface Slot {
  startAt: string;
  endAt: string;
}

export interface SlotsResponse {
  date: string;
  durationMinutes: number;
  professionals: (PublicProfessional & { slots: Slot[] })[];
}

export interface AvailabilityBlock {
  id: string;
  professionalId: string;
  startAt: string;
  endAt: string;
  status: 'ACTIVE' | 'INACTIVE';
  professional: { id: string; firstName: string; lastName: string };
  confirmedAppointments: number;
}

export interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  professional: { id: string; firstName: string; lastName: string };
  specialty: SpecialtyRef;
  patient?: { id: string; firstName: string; lastName: string; phone: string | null; email?: string };
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface Agenda {
  date: string;
  professional: { id: string; firstName: string; lastName: string };
  confirmedForDate: number;
  upcomingConfirmed: number;
  appointments: Appointment[];
}

/** Restricciones de acceso que se activan desde el panel de administración. */
export interface AccessSettings {
  adminOnlyLogin: boolean;
  registrationClosed: boolean;
}

export interface AppConfig extends AccessSettings {
  appointmentDurationMinutes: number;
  timeZone: string;
}

export interface Invitation {
  invitationId: string;
  expiresAt: string;
  token: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  PATIENT: 'Paciente',
  PROFESSIONAL: 'Profesional',
  APPOINTMENT_MANAGER: 'Gestor de turnos',
  ADMIN: 'Administrador',
  SUPER_ADMIN: 'Super Admin',
};
