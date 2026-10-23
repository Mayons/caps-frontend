import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { firebaseErrorMessage, useAuth } from '../auth/AuthContext';
import { safeRedirect } from '../auth/ProtectedRoute';
import { TextField } from '../components/Field';
import { Alert } from '../components/Feedback';

export function LoginPage() {
  const { signIn, signInWithGoogle, status, profile, refreshProfile } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN';
  const redirect = safeRedirect(params.get('redirect'), isAdmin ? '/gestion' : '/');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // Cuando la sesión queda lista, ir a la pantalla pedida.
  useEffect(() => {
    if (status === 'ready') navigate(redirect, { replace: true });
    if (status === 'needsRegistration') navigate(`/completar-registro?redirect=${encodeURIComponent(redirect)}`, { replace: true });
    if (status === 'inactive') navigate('/cuenta-inactiva', { replace: true });
    if (status === 'adminOnly') navigate('/acceso-restringido', { replace: true });
    if (status === 'registrationClosed') navigate('/registro-cerrado', { replace: true });
  }, [status, redirect, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Completá el email y la contraseña.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(firebaseErrorMessage(err));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <section className="card auth-card">
      <h1>Ingresar</h1>
      <p className="muted">Usá tu cuenta para sacar y consultar turnos.</p>
      {error && <Alert>{error}</Alert>}
      {status === 'error' && (
        <Alert>
          <p>No pudimos cargar tu perfil de CAPS. Revisá la conexión y volvé a intentar.</p>
          <button type="button" className="btn btn-secondary" onClick={() => refreshProfile()}>Reintentar</button>
        </Alert>
      )}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <TextField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField label="Contraseña" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn btn-block" disabled={submitting || googleSubmitting}>
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
        <div className="auth-divider" aria-hidden="true">o</div>
        <button type="button" className="btn btn-block auth-google" disabled={submitting || googleSubmitting} onClick={handleGoogleSignIn}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt="" />
          <span>{googleSubmitting ? 'Conectando con Google…' : 'Iniciar sesión con Google'}</span>
        </button>
      </form>
      <p className="small" style={{ marginTop: '1rem' }}>
        <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>
      </p>
      <p className="small">
        ¿No tenés cuenta? <Link to={`/registro?redirect=${encodeURIComponent(redirect)}`}>Creá una cuenta</Link>
      </p>
    </section>
  );
}
