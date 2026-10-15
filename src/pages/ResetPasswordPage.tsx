import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { firebaseErrorMessage, useAuth } from '../auth/AuthContext';
import { TextField } from '../components/Field';
import { Alert } from '../components/Feedback';
import { isEmail } from '../utils/validation';

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setError('Ingresá un email válido.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      // Para no revelar qué emails tienen cuenta, "usuario inexistente" se muestra como éxito.
      if ((err as { code?: string }).code === 'auth/user-not-found') setSent(true);
      else setError(firebaseErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card auth-card">
      <h1>Recuperar contraseña</h1>
      {sent ? (
        <Alert kind="success">
          Si existe una cuenta con ese email, te enviamos un enlace para crear una nueva contraseña. Revisá también la carpeta de spam.
        </Alert>
      ) : (
        <form className="form" onSubmit={handleSubmit} noValidate>
          <p className="muted">Te vamos a enviar un email con un enlace para elegir una contraseña nueva.</p>
          {error && <Alert>{error}</Alert>}
          <TextField label="Email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn btn-block" disabled={submitting}>{submitting ? 'Enviando…' : 'Enviar enlace'}</button>
        </form>
      )}
      <p className="small" style={{ marginTop: '1rem' }}>
        <Link to="/ingresar">Volver a ingresar</Link>
      </p>
    </section>
  );
}
