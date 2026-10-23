import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Role } from '../api/types';
import { Loading } from '../components/Feedback';

/**
 * Protege una pantalla según la sesión y el rol.
 * Ocultar pantallas mejora la experiencia, pero la seguridad real está en el
 * backend: aunque alguien fuerce la URL, la API rechaza la operación.
 */
export function ProtectedRoute({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { status, profile } = useAuth();
  const location = useLocation();
  const redirect = encodeURIComponent(location.pathname + location.search);

  if (status === 'loading') return <Loading />;
  if (status === 'signedOut') return <Navigate to={`/ingresar?redirect=${redirect}`} replace />;
  if (status === 'needsRegistration') return <Navigate to={`/completar-registro?redirect=${redirect}`} replace />;
  if (status === 'inactive') return <Navigate to="/cuenta-inactiva" replace />;
  if (status === 'adminOnly') return <Navigate to="/acceso-restringido" replace />;
  if (status === 'registrationClosed') return <Navigate to="/registro-cerrado" replace />;
  if (status === 'error' || !profile) return <Navigate to="/sin-conexion" replace />;
  if (roles && !roles.includes(profile.role)) return <Navigate to="/sin-permiso" replace />;
  return <>{children}</>;
}

/** Ruta interna segura para redirigir después de iniciar sesión. */
export function safeRedirect(value: string | null, fallback = '/') {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
