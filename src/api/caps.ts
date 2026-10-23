import { apiRequest } from './client';
import type {
  AccessSettings,
  Agenda,
  AppConfig,
  Appointment,
  AppointmentStatus,
  AvailabilityBlock,
  Invitation,
  ManagedProfessional,
  Paginated,
  PublicProfessional,
  Role,
  SlotsResponse,
  Specialty,
  UserProfile,
} from './types';

// Una función por endpoint de la API. Las pantallas usan estas funciones
// en lugar de llamar a `fetch` directamente.

export interface RegisterData {
  firstName: string;
  lastName: string;
  phone?: string;
}

export type AssignableUserRole = 'PATIENT' | 'APPOINTMENT_MANAGER' | 'ADMIN';

export interface CreateUserData extends RegisterData {
  email: string;
  role: AssignableUserRole;
}

export interface ProfessionalData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string | null;
  isActive: boolean;
  allowAvailabilityManagement: boolean;
  specialtyIds: string[];
}

export interface BookingData {
  professionalId: string;
  specialtyId: string;
  startAt: string;
}

export const capsApi = {
  // Configuración
  getConfig: () => apiRequest<AppConfig>('GET', '/config'),
  getSettings: () => apiRequest<AccessSettings>('GET', '/settings'),
  updateSettings: (data: Partial<AccessSettings>) => apiRequest<AccessSettings>('PATCH', '/settings', { body: data }),

  // Autenticación y perfil
  getMe: () => apiRequest<UserProfile>('GET', '/auth/me'),
  register: (data: RegisterData) => apiRequest<UserProfile>('POST', '/auth/register', { body: data }),
  updateMe: (data: Partial<RegisterData>) => apiRequest<UserProfile>('PATCH', '/auth/me', { body: data }),

  // Especialidades
  listSpecialties: () => apiRequest<Specialty[]>('GET', '/specialties'),
  listAllSpecialties: () => apiRequest<Specialty[]>('GET', '/specialties/manage'),
  createSpecialty: (data: { name: string; description: string | null }) =>
    apiRequest<Specialty>('POST', '/specialties', { body: data }),
  updateSpecialty: (id: string, data: Partial<Pick<Specialty, 'name' | 'description' | 'isActive'>>) =>
    apiRequest<Specialty>('PATCH', `/specialties/${id}`, { body: data }),

  // Profesionales
  listProfessionals: (specialtyId?: string) =>
    apiRequest<PublicProfessional[]>('GET', '/professionals', { query: { specialtyId } }),
  listManagedProfessionals: (query: { search?: string; page?: number }) =>
    apiRequest<Paginated<ManagedProfessional>>('GET', '/professionals/manage', { query }),
  createProfessional: (data: ProfessionalData) =>
    apiRequest<ManagedProfessional>('POST', '/professionals', { body: data }),
  updateProfessional: (id: string, data: Partial<ProfessionalData>) =>
    apiRequest<ManagedProfessional>('PATCH', `/professionals/${id}`, { body: data }),
  createInvitation: (id: string) => apiRequest<Invitation>('POST', `/professionals/${id}/invitations`),
  revokeInvitations: (id: string) => apiRequest<{ revoked: number }>('DELETE', `/professionals/${id}/invitations`),
  revokeProfessionalAccess: (id: string) =>
    apiRequest<ManagedProfessional>('POST', `/professionals/${id}/revoke-access`),
  linkProfessional: (token: string) =>
    apiRequest<{ professionalId: string }>('POST', '/professionals/link', { body: { token } }),

  // Disponibilidad
  listSlots: (query: { date: string; specialtyId?: string; professionalId?: string }) =>
    apiRequest<SlotsResponse>('GET', '/availability/slots', { query }),
  listBlocks: (query: { professionalId?: string; includeInactive?: boolean }) =>
    apiRequest<AvailabilityBlock[]>('GET', '/availability', { query }),
  createBlock: (data: { professionalId: string; startAt: string; endAt: string }) =>
    apiRequest<AvailabilityBlock>('POST', '/availability', { body: data }),
  updateBlock: (id: string, data: { startAt?: string; endAt?: string }) =>
    apiRequest<AvailabilityBlock>('PATCH', `/availability/${id}`, { body: data }),
  deactivateBlock: (id: string) => apiRequest<AvailabilityBlock>('POST', `/availability/${id}/deactivate`),

  // Turnos
  bookAppointment: (data: BookingData) => apiRequest<Appointment>('POST', '/appointments', { body: data }),
  listMyAppointments: (query: { scope: 'upcoming' | 'past' | 'all'; page?: number }) =>
    apiRequest<Paginated<Appointment>>('GET', '/appointments/mine', { query }),
  getAgenda: (date?: string) => apiRequest<Agenda>('GET', '/appointments/agenda', { query: { date } }),
  listAllAppointments: (query: { date?: string; professionalId?: string; status?: AppointmentStatus; page?: number }) =>
    apiRequest<Paginated<Appointment>>('GET', '/appointments', { query }),
  getAppointment: (id: string) => apiRequest<Appointment>('GET', `/appointments/${id}`),
  rescheduleAppointment: (id: string, data: Partial<BookingData>) =>
    apiRequest<Appointment>('PATCH', `/appointments/${id}`, { body: data }),
  cancelAppointment: (id: string) => apiRequest<Appointment>('POST', `/appointments/${id}/cancel`),

  // Usuarios
  listUsers: (query: { search?: string; role?: Role; page?: number }) =>
    apiRequest<Paginated<UserProfile>>('GET', '/users', { query }),
  createUser: (data: CreateUserData) => apiRequest<UserProfile>('POST', '/users', { body: data }),
  changeUserRole: (id: string, role: AssignableUserRole) =>
    apiRequest<UserProfile>('PATCH', `/users/${id}/role`, { body: { role } }),
  changeUserStatus: (id: string, isActive: boolean) =>
    apiRequest<UserProfile>('PATCH', `/users/${id}/status`, { body: { isActive } }),
  deleteUser: (id: string) => apiRequest<void>('DELETE', `/users/${id}`),
};
