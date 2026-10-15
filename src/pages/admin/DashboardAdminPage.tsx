import { ArrowRight, CalendarDays, RefreshCw, ShieldCheck, Stethoscope, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { capsApi } from '../../api/caps';
import { ROLE_LABELS } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Alert, EmptyState, Loading, PageHeader, StatusBadge } from '../../components/Feedback';
import { fullName } from '../../utils/dates';
import { useAsync } from '../../utils/useAsync';

export function DashboardAdminPage() {
  const { profile } = useAuth();
  const overview = useAsync(async () => {
    const [users, specialties, professionals, appointments] = await Promise.all([
      capsApi.listUsers({ page: 1 }),
      capsApi.listAllSpecialties(),
      capsApi.listManagedProfessionals({ page: 1 }),
      capsApi.listAllAppointments({ page: 1, status: 'CONFIRMED' }),
    ]);
    return { users, specialties, professionals, appointments };
  }, []);

  const modules = [
    { to: '/gestion/usuarios', label: 'Usuarios y roles', value: overview.data?.users.total, unit: 'usuarios', icon: Users, tone: 'blue' },
    { to: '/gestion/especialidades', label: 'Especialidades', value: overview.data?.specialties.filter(item => item.isActive).length, unit: 'activas', icon: Stethoscope, tone: 'green' },
    { to: '/gestion/profesionales', label: 'Profesionales', value: overview.data?.professionals.total, unit: 'profesionales', icon: ShieldCheck, tone: 'red' },
    { to: '/gestion/turnos', label: 'Turnos', value: overview.data?.appointments.total, unit: 'confirmados', icon: CalendarDays, tone: 'blue' },
  ];

  return (
    <>
      <PageHeader title="Administración" subtitle="CAPS Las Isletillas" actions={
        <>
          <button className="btn btn-secondary admin-icon-button" title="Actualizar resumen" aria-label="Actualizar resumen" disabled={overview.loading} onClick={overview.reload}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
          <Link className="btn" to="/gestion/usuarios?crear=1"><UserPlus size={18} aria-hidden="true" />Nuevo usuario</Link>
        </>
      } />
      <div className="admin-session">
        <span>{profile?.firstName}</span>
        <span className="admin-role"><ShieldCheck size={16} aria-hidden="true" />{profile && ROLE_LABELS[profile.role]}</span>
      </div>

      {overview.error && <Alert>{overview.error}</Alert>}
      <nav className="admin-modules" aria-label="Gestión administrativa">
        {modules.map(({ to, label, value, unit, icon: Icon, tone }) => (
          <Link key={to} to={to} className={`admin-module admin-module-${tone}`}>
            <div className="admin-module-heading"><Icon size={22} aria-hidden="true" /><span>{label}</span><ArrowRight size={18} aria-hidden="true" /></div>
            <div className="admin-module-value"><strong>{value ?? '...'}</strong><span>{unit}</span></div>
          </Link>
        ))}
      </nav>

      <section className="admin-directory" aria-labelledby="directory-title">
        <div className="admin-section-heading">
          <h2 id="directory-title">Directorio de usuarios</h2>
          <Link to="/gestion/usuarios">Ver todos <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        {overview.loading && <Loading />}
        {overview.data?.users.items.length === 0 && <EmptyState title="Todavía no hay usuarios" />}
        {overview.data && overview.data.users.items.length > 0 && (
          <table className="responsive-table">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th></tr></thead>
            <tbody>
              {overview.data.users.items.slice(0, 5).map(user => (
                <tr key={user.id}>
                  <td data-label="Usuario"><div className="admin-user-identity"><strong>{fullName(user)}</strong><br /><span className="muted small">{user.email}</span></div></td>
                  <td data-label="Rol">{ROLE_LABELS[user.role]}</td>
                  <td data-label="Estado"><StatusBadge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}