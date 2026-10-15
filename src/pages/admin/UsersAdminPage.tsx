import { useState, type FormEvent } from 'react';
import { Pause, Play, Plus, Trash2, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { capsApi, type AssignableUserRole, type CreateUserData } from '../../api/caps';
import { errorMessage } from '../../api/client';
import { ROLE_LABELS, type Role, type UserProfile } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { useAsync } from '../../utils/useAsync';
import { fullName } from '../../utils/dates';
import { SelectField, TextField } from '../../components/Field';
import { Alert, EmptyState, Loading, PageHeader, Pager, StatusBadge } from '../../components/Feedback';

const EMPTY_USER: CreateUserData = { firstName: '', lastName: '', email: '', phone: '', role: 'PATIENT' };

export function UsersAdminPage() {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';
  const assignable: AssignableUserRole[] = isSuperAdmin ? ['PATIENT', 'APPOINTMENT_MANAGER', 'ADMIN'] : ['PATIENT', 'APPOINTMENT_MANAGER'];
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [page, setPage] = useState(1);
  const [params] = useSearchParams();
  const [creating, setCreating] = useState(params.get('crear') === '1');
  const [form, setForm] = useState<CreateUserData>(EMPTY_USER);
  const [busy, setBusy] = useState<string | null>(null);
  const users = useAsync(() => capsApi.listUsers({ search: search || undefined, role: roleFilter || undefined, page }), [search, roleFilter, page]);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const run = async (id: string, action: () => Promise<unknown>, success: string) => {
    setMessage(null);
    setBusy(id);
    try {
      await action();
      setMessage({ kind: 'success', text: success });
      users.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setBusy('create');
    setMessage(null);
    try {
      await capsApi.createUser({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone?.trim() || undefined,
      });
      setForm(EMPTY_USER);
      setCreating(false);
      setMessage({ kind: 'success', text: 'Usuario creado. Podrá ingresar con ese email verificado en Firebase.' });
      users.reload();
    } catch (err) {
      setMessage({ kind: 'error', text: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  };

  const canEditRole = (user: UserProfile) =>
    user.id !== profile?.id && user.role !== 'SUPER_ADMIN' && user.role !== 'PROFESSIONAL' &&
    (isSuperAdmin || user.role !== 'ADMIN');

  return (
    <>
      <Link className="admin-back" to="/gestion">Administración</Link>
      <PageHeader title="Usuarios y accesos" actions={
        <button className="btn" disabled={busy !== null} onClick={() => setCreating(!creating)}>
          {creating ? <X size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
          {creating ? 'Cerrar alta' : 'Nuevo usuario'}
        </button>
      } />
      {message && <Alert kind={message.kind}>{message.text}</Alert>}
      {creating && (
        <form className="form admin-create-user" onSubmit={handleCreate}>
          <h2>Nuevo usuario</h2>
          <div className="form-grid two">
            <TextField label="Nombre" name="firstName" value={form.firstName} maxLength={80} required onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
            <TextField label="Apellido" name="lastName" value={form.lastName} maxLength={80} required onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
            <TextField label="Email" name="email" type="email" value={form.email} maxLength={254} required onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <TextField label="Teléfono (opcional)" name="phone" type="tel" value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <SelectField label="Rol" name="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AssignableUserRole })}>
              {assignable.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
            </SelectField>
          </div>
          <div className="form-actions">
            <button className="btn" disabled={busy !== null}><Plus size={18} aria-hidden="true" />{busy === 'create' ? 'Creando…' : 'Crear usuario'}</button>
            <button type="button" className="btn btn-secondary" disabled={busy !== null} onClick={() => setCreating(false)}>Cancelar</button>
          </div>
        </form>
      )}
      <div className="admin-user-filters">
        <TextField label="Buscar" name="search" type="search" placeholder="Nombre, apellido o email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <SelectField label="Rol" name="roleFilter" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value as Role | ''); setPage(1); }}>
          <option value="">Todos los roles</option>
          {Object.entries(ROLE_LABELS).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
        </SelectField>
      </div>

      {users.loading && <Loading />}
      {users.error && <Alert>{users.error}</Alert>}
      {users.data?.items.length === 0 && <EmptyState title="No se encontraron usuarios" />}
      {users.data && users.data.items.length > 0 && (
        <table className="responsive-table">
          <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {users.data.items.map((user) => (
              <tr key={user.id}>
                <td data-label="Usuario">
                  <div className="admin-user-identity">
                    <strong>{fullName(user)}</strong>
                    <br />
                    <span className="muted small">{user.email}</span>
                  </div>
                </td>
                <td data-label="Rol">
                  {canEditRole(user) ? (
                    <select
                      aria-label={`Rol de ${fullName(user)}`}
                      value={user.role}
                      disabled={busy !== null}
                      onChange={(e) => {
                        const role = e.target.value as AssignableUserRole;
                        if (window.confirm(`¿Asignar el rol ${ROLE_LABELS[role]} a ${fullName(user)}?`)) {
                          run(user.id, () => capsApi.changeUserRole(user.id, role), 'Rol actualizado.');
                        }
                      }}
                      style={{ minHeight: 44 }}
                    >
                      {assignable.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                    </select>
                  ) : (
                    ROLE_LABELS[user.role]
                  )}
                </td>
                <td data-label="Estado"><StatusBadge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                <td className="actions">
                  {isSuperAdmin && user.id !== profile?.id && (
                    <button
                      className={`btn ${user.isActive ? 'btn-danger' : 'btn-secondary'}`}
                      disabled={busy !== null}
                      onClick={() =>
                        window.confirm(user.isActive ? `¿Revocar el acceso de ${fullName(user)}?` : `¿Reactivar a ${fullName(user)}?`) &&
                        run(user.id, () => capsApi.changeUserStatus(user.id, !user.isActive), user.isActive ? 'Acceso revocado.' : 'Usuario reactivado.')
                      }
                    >
                      {user.isActive ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                      {user.isActive ? 'Restringir' : 'Reactivar'}
                    </button>
                  )}
                  {isSuperAdmin && user.id !== profile?.id && user.role !== 'SUPER_ADMIN' && (
                    <button className="btn btn-danger admin-icon-button" disabled={busy !== null}
                      title={`Eliminar perfil de ${fullName(user)}`} aria-label={`Eliminar perfil de ${fullName(user)}`}
                      onClick={() => window.confirm(`¿Eliminar el perfil de ${fullName(user)}? Solo se permite si no tiene registros vinculados. Su cuenta de Firebase no se elimina.`) &&
                        run(user.id, () => capsApi.deleteUser(user.id), 'Perfil eliminado.')}>
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {users.data && <Pager {...users.data} onChange={setPage} />}
    </>
  );
}
