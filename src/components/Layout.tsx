import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS, type Role, type UserProfile } from '../api/types';

interface NavItem {
  to: string;
  label: string;
}

/** Menú según el rol. El backend valida igual cada permiso. */
function navItemsFor(profile: UserProfile | null): NavItem[] {
  const items: NavItem[] = [
    { to: '/profesionales', label: 'Profesionales' },
  ];
  if (!profile || profile.role === 'PATIENT') {
    items.push({ to: '/turnos/nuevo', label: 'Sacar turno' });
  }
  if (!profile) return items;

  const byRole: Record<Role, NavItem[]> = {
    PATIENT: [{ to: '/mis-turnos', label: 'Mis turnos' }],
    PROFESSIONAL: [
      { to: '/agenda', label: 'Mi agenda' },
      ...(profile.canManageOwnAvailability ? [{ to: '/disponibilidad', label: 'Disponibilidad' }] : []),
    ],
    APPOINTMENT_MANAGER: [
      { to: '/gestion/turnos', label: 'Turnos' },
      { to: '/disponibilidad', label: 'Disponibilidad' },
    ],
    ADMIN: [
      { to: '/gestion', label: 'Administración' },
      { to: '/gestion/turnos', label: 'Turnos' },
      { to: '/disponibilidad', label: 'Disponibilidad' },
    ],
    SUPER_ADMIN: [
      { to: '/gestion', label: 'Administración' },
      { to: '/gestion/turnos', label: 'Turnos' },
      { to: '/disponibilidad', label: 'Disponibilidad' },
    ],
  };
  return [...items, ...byRole[profile.role]];
}

export function Layout() {
  const { status, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Cerrar el menú del celular al cambiar de pantalla.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="CAPS Las Isletillas, inicio">
            <span className="brand-mark" aria-hidden="true">+</span>
            <span>
              <strong>CAPS</strong>
              <small>Las Isletillas</small>
            </span>
          </Link>

          <button
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'Cerrar' : 'Menú'}
          </button>

          <nav id="main-nav" className={`main-nav ${menuOpen ? 'open' : ''}`} aria-label="Principal">
            {navItemsFor(status === 'ready' ? profile : null).map((item) => (
              <NavLink key={item.to} to={item.to} end>
                {item.label}
              </NavLink>
            ))}
            <div className="nav-session">
              {status === 'ready' && profile ? (
                <>
                  <span className="nav-user">
                    {profile.firstName}
                    <small>{ROLE_LABELS[profile.role]}</small>
                  </span>
                  <button className="btn btn-light" onClick={handleSignOut}>
                    Salir
                  </button>
                </>
              ) : status !== 'loading' && status !== 'signedOut' ? (
                <button className="btn btn-light" onClick={handleSignOut}>
                  Salir
                </button>
              ) : (
                <>
                  <NavLink to="/ingresar">Ingresar</NavLink>
                  <Link to="/registro" className="btn btn-light">
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main id="contenido" className="container main-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>Centro de Atención Primaria de la Salud — Comuna de Las Isletillas</p>
          <p className="muted">Ante una emergencia, comunicate con el servicio de emergencias de tu zona.</p>
          <div className="footer-credits">
            <p>&copy; {new Date().getFullYear()} CAPS Las Isletillas. Todos los derechos reservados.</p>
            <p>Desarrollado por <strong>Colegio Gabriela Mistral - Isletillas, Córdoba</strong>, en colaboración con <strong>LitaCloud</strong>.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
