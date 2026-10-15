import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { safeRedirect } from '../auth/ProtectedRoute';
import { errorMessage } from '../api/client';
import { TextField } from '../components/Field';
import { Alert, Loading } from '../components/Feedback';
import { hasErrors, isPhone, type Errors } from '../utils/validation';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
}

/** Para cuentas de Firebase que todavía no tienen usuario en CAPS. */
export function CompleteRegistrationPage() {
  const { status, firebaseUser, completeRegistration, signOut } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const redirect = safeRedirect(params.get('redirect'));
  const [form, setForm] = useState<ProfileForm>({ firstName: '', lastName: '', phone: '' });
  const [errors, setErrors] = useState<Errors<ProfileForm>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'ready') navigate(redirect, { replace: true });
  }, [status, redirect, navigate]);

  if (status === 'loading') return <Loading />;
  if (status === 'signedOut') return <Navigate to="/ingresar" replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found: Errors<ProfileForm> = {
      firstName: form.firstName.trim() ? undefined : 'Ingresá tu nombre',
      lastName: form.lastName.trim() ? undefined : 'Ingresá tu apellido',
      phone: !form.phone.trim() || isPhone(form.phone) ? undefined : 'Teléfono inválido',
    };
    setErrors(found);
    if (hasErrors(found)) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeRegistration({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card auth-card">
      <h1>Completá tu registro</h1>
      <p className="muted">Ingresaste como {firebaseUser?.email}. Necesitamos tus datos para asignarte turnos.</p>
      <form className="form" onSubmit={handleSubmit} noValidate>
        {error && <Alert>{error}</Alert>}
        <TextField label="Nombre" name="firstName" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} error={errors.firstName} />
        <TextField label="Apellido" name="lastName" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} error={errors.lastName} />
        <TextField label="Teléfono (opcional)" name="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />
        <div className="form-actions">
          <button className="btn" disabled={submitting}>{submitting ? 'Guardando…' : 'Guardar'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => signOut()}>Salir</button>
        </div>
      </form>
    </section>
  );
}
