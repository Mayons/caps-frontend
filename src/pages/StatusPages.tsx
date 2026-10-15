import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { missingConfig } from '../config';

function StatusCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card auth-card">
      <h1>{title}</h1>
      {children}
    </section>
  );
}

export function NotFoundPage() {
  return (
    <StatusCard title="Página no encontrada">
      <p>La dirección que buscás no existe.</p>
      <Link className="btn" to="/">Ir al inicio</Link>
    </StatusCard>
  );
}

export function ForbiddenPage() {
  return (
    <StatusCard title="Sin permiso">
      <p>Tu cuenta no tiene permiso para ver esta sección.</p>
      <Link className="btn" to="/">Ir al inicio</Link>
    </StatusCard>
  );
}

export function InactiveAccountPage() {
  const { signOut } = useAuth();
  return (
    <StatusCard title="Cuenta desactivada">
      <p>Tu cuenta está desactivada. Si creés que es un error, comunicate con el CAPS.</p>
      <button className="btn" onClick={() => signOut()}>Salir</button>
    </StatusCard>
  );
}

export function OfflinePage() {
  const { refreshProfile, signOut } = useAuth();
  return (
    <StatusCard title="No pudimos conectarnos">
      <p>El servidor de turnos no responde en este momento. Probá de nuevo en unos minutos.</p>
      <div className="form-actions">
        <button className="btn" onClick={() => refreshProfile()}>Reintentar</button>
        <button className="btn btn-secondary" onClick={() => signOut()}>Salir</button>
      </div>
    </StatusCard>
  );
}

export function ConfigErrorPage() {
  return (
    <main className="container main-content">
      <StatusCard title="Falta configuración">
        <p>La aplicación no tiene configuradas estas variables de entorno:</p>
        <ul className="mono">
          {missingConfig.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <p className="muted">Copiá <code>.env.example</code> como <code>.env.local</code>, completalo y reiniciá <code>npm run dev</code>.</p>
      </StatusCard>
    </main>
  );
}
