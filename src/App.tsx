import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { CompleteRegistrationPage } from './pages/CompleteRegistrationPage';
import { ProfessionalsPage } from './pages/ProfessionalsPage';
import { BookingPage } from './pages/BookingPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import { RescheduleAppointmentPage } from './pages/RescheduleAppointmentPage';
import { AgendaPage } from './pages/AgendaPage';
import { AvailabilityPage } from './pages/AvailabilityPage';
import { InvitationPage } from './pages/InvitationPage';
import { AppointmentsAdminPage } from './pages/admin/AppointmentsAdminPage';
import { ProfessionalsAdminPage } from './pages/admin/ProfessionalsAdminPage';
import { SpecialtiesAdminPage } from './pages/admin/SpecialtiesAdminPage';
import { UsersAdminPage } from './pages/admin/UsersAdminPage';
import { DashboardAdminPage } from './pages/admin/DashboardAdminPage';
import { ForbiddenPage, InactiveAccountPage, NotFoundPage, OfflinePage } from './pages/StatusPages';
import type { Role } from './api/types';

const STAFF: Role[] = ['APPOINTMENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
const ADMINS: Role[] = ['ADMIN', 'SUPER_ADMIN'];

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Público */}
            <Route index element={<HomePage />} />
            <Route path="profesionales" element={<ProfessionalsPage />} />
            <Route path="ingresar" element={<LoginPage />} />
            <Route path="registro" element={<RegisterPage />} />
            <Route path="recuperar" element={<ResetPasswordPage />} />
            <Route path="completar-registro" element={<CompleteRegistrationPage />} />
            <Route path="invitacion" element={<InvitationPage />} />
            <Route path="cuenta-inactiva" element={<InactiveAccountPage />} />
            <Route path="sin-conexion" element={<OfflinePage />} />
            <Route path="sin-permiso" element={<ForbiddenPage />} />

            <Route path="turnos/nuevo" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />

            {/* Paciente */}
            <Route path="mis-turnos" element={<ProtectedRoute roles={['PATIENT']}><MyAppointmentsPage /></ProtectedRoute>} />
            <Route path="turnos/:id/confirmacion" element={<ProtectedRoute roles={['PATIENT']}><ConfirmationPage /></ProtectedRoute>} />
            <Route path="turnos/:id/editar" element={<ProtectedRoute roles={['PATIENT', ...STAFF]}><RescheduleAppointmentPage /></ProtectedRoute>} />

            {/* Profesional */}
            <Route path="agenda" element={<ProtectedRoute roles={['PROFESSIONAL']}><AgendaPage /></ProtectedRoute>} />

            {/* Disponibilidad: personal de turnos y profesionales con permiso */}
            <Route path="disponibilidad" element={<ProtectedRoute roles={[...STAFF, 'PROFESSIONAL']}><AvailabilityPage /></ProtectedRoute>} />

            {/* Gestión */}
            <Route path="gestion" element={<ProtectedRoute roles={ADMINS}><DashboardAdminPage /></ProtectedRoute>} />
            <Route path="gestion/turnos" element={<ProtectedRoute roles={STAFF}><AppointmentsAdminPage /></ProtectedRoute>} />
            <Route path="gestion/profesionales" element={<ProtectedRoute roles={ADMINS}><ProfessionalsAdminPage /></ProtectedRoute>} />
            <Route path="gestion/especialidades" element={<ProtectedRoute roles={ADMINS}><SpecialtiesAdminPage /></ProtectedRoute>} />
            <Route path="gestion/usuarios" element={<ProtectedRoute roles={ADMINS}><UsersAdminPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
