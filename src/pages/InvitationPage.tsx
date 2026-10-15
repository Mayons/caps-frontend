import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { capsApi } from '../api/caps';
import { errorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Alert, Loading } from '../components/Feedback';

const STORAGE_KEY = 'caps.invitationToken';

/**
 * Vinculación de un profesional con su cuenta mediante una invitación.
 * El token se mueve de la URL a sessionStorage para que no quede en el
 * historial del navegador ni se comparta por error al copiar la dirección.
 */
export function InvitationPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { status, profile, firebaseUser, resendVerification, reloadFirebaseUser, refreshProfile } = useAuth();
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fromUrl = params.get('token');
    if (fromUrl) {
      sessionStorage.setItem(STORAGE_KEY, fromUrl);
      setToken(fromUrl);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  if (!token) {
    return <Alert>El enlace de invitación no es válido. Pedile uno nuevo a la administración del CAPS.</Alert>;
  }
  if (status === 'loading') return <Loading />;

  const handleLink = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await capsApi.linkProfessional(token);
      sessionStorage.removeItem(STORAGE_KEY);
      await refreshProfile();
      navigate('/agenda', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckVerification = async () => {
    await reloadFirebaseUser();
    setInfo(null);
  };

  const redirect = encodeURIComponent('/invitacion');

  return (
    <section className="card auth-card stack">
      <h1>Vincular cuenta profesional</h1>
      <p className="muted">
        Recibiste una invitación del CAPS. Ingresá (o creá tu cuenta) con el <strong>mismo email</strong> que registró la administración.
      </p>
      {error && <Alert>{error}</Alert>}
      {info && <Alert kind="success">{info}</Alert>}

      {status === 'signedOut' && (
        <div className="form-actions">
          <Link className="btn" to={`/ingresar?redirect=${redirect}`}>Ingresar</Link>
          <Link className="btn btn-secondary" to={`/registro?redirect=${redirect}`}>Crear cuenta</Link>
        </div>
      )}

      {status === 'needsRegistration' && (
        <Link className="btn" to={`/completar-registro?redirect=${redirect}`}>Completar registro</Link>
      )}

      {status === 'ready' && profile && (
        <>
          <p>Cuenta actual: <strong>{profile.email}</strong></p>
          {profile.role === 'PROFESSIONAL' ? (
            <Alert kind="info">Tu cuenta ya está vinculada. <Link to="/agenda">Ir a mi agenda</Link></Alert>
          ) : !firebaseUser?.emailVerified ? (
            <>
              <Alert kind="warning">Antes de vincular la cuenta tenés que verificar tu email. Revisá tu correo.</Alert>
              <div className="form-actions">
                <button className="btn" onClick={handleCheckVerification}>Ya verifiqué mi email</button>
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    await resendVerification();
                    setInfo('Te reenviamos el email de verificación.');
                  }}
                >
                  Reenviar email
                </button>
              </div>
            </>
          ) : (
            <button className="btn btn-block" onClick={handleLink} disabled={submitting}>
              {submitting ? 'Vinculando…' : 'Vincular mi cuenta'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
