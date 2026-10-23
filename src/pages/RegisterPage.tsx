import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { firebaseErrorMessage, useAuth } from '../auth/AuthContext';
import { safeRedirect } from '../auth/ProtectedRoute';
import { errorMessage } from '../api/client';
import { capsApi } from '../api/caps';
import { TextField } from '../components/Field';
import { Alert, Loading } from '../components/Feedback';
import { useAsync } from '../utils/useAsync';
import { hasErrors, isEmail, isPhone, type Errors } from '../utils/validation';
import { AdminOnlyPage, RegistrationClosedPage } from './StatusPages';

interface RegisterForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const emptyForm: RegisterForm = { firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: '' };

function validate(form: RegisterForm): Errors<RegisterForm> {
  return {
    firstName: form.firstName.trim() ? undefined : 'Ingresá tu nombre',
    lastName: form.lastName.trim() ? undefined : 'Ingresá tu apellido',
    phone: !form.phone.trim() || isPhone(form.phone) ? undefined : 'Teléfono inválido',
    email: isEmail(form.email) ? undefined : 'Ingresá un email válido',
    password: form.password.length >= 8 ? undefined : 'La contraseña debe tener al menos 8 caracteres',
    confirmPassword: form.password === form.confirmPassword ? undefined : 'Las contraseñas no coinciden',
  };
}

/** Registro público: siempre crea una cuenta de paciente. */
export function RegisterPage() {
  const { signUp, status } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const redirect = safeRedirect(params.get('redirect'));
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Errors<RegisterForm>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const appConfig = useAsync(() => capsApi.getConfig(), []);

  useEffect(() => {
    if (status === 'ready') navigate(redirect, { replace: true });
    if (status === 'adminOnly') navigate('/acceso-restringido', { replace: true });
    if (status === 'registrationClosed') navigate('/registro-cerrado', { replace: true });
  }, [status, redirect, navigate]);

  const update = (field: keyof RegisterForm) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (hasErrors(found)) return;

    setError(null);
    setSubmitting(true);
    try {
      await signUp(form.email, form.password, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError(code?.startsWith('auth/') ? firebaseErrorMessage(err) : errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (appConfig.loading) return <Loading />;
  if (appConfig.data?.adminOnlyLogin) return <AdminOnlyPage />;
  if (appConfig.data?.registrationClosed) return <RegistrationClosedPage />;

  return (
    <section className="card auth-card">
      <h1>Crear cuenta</h1>
      <p className="muted">Con tu cuenta vas a poder sacar, reprogramar y cancelar tus turnos.</p>
      <form className="form" onSubmit={handleSubmit} noValidate>
        {error && <Alert>{error}</Alert>}
        <div className="form-grid two">
          <TextField label="Nombre" name="firstName" autoComplete="given-name" value={form.firstName} onChange={update('firstName')} error={errors.firstName} />
          <TextField label="Apellido" name="lastName" autoComplete="family-name" value={form.lastName} onChange={update('lastName')} error={errors.lastName} />
        </div>
        <TextField label="Teléfono (opcional)" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} error={errors.phone} />
        <TextField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />
        <TextField label="Contraseña" name="password" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} error={errors.password} hint="Al menos 8 caracteres" />
        <TextField label="Repetí la contraseña" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={update('confirmPassword')} error={errors.confirmPassword} />
        <button className="btn btn-block" disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="small" style={{ marginTop: '1rem' }}>
        ¿Ya tenés cuenta? <Link to={`/ingresar?redirect=${encodeURIComponent(redirect)}`}>Ingresá</Link>
      </p>
    </section>
  );
}
