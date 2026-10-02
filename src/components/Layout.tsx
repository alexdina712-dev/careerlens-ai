import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  ScanSearch,
  LayoutDashboard,
  Files,
  BriefcaseBusiness,
  Sparkles,
  ShieldCheck,
  Menu,
  LogOut,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { ErrorMessage } from './ui';
const links = [
  ['/', 'Overview', LayoutDashboard],
  ['/cvs', 'CV library', Files],
  ['/jobs', 'Applications', BriefcaseBusiness],
  ['/analyses', 'Analysis studio', Sparkles],
  ['/privacy', 'Privacy & account', ShieldCheck],
] as const;
export default function Layout() {
  const { user, logout } = useAuth(),
    { loading, error, reload } = useWorkspace();
  const [open, setOpen] = useState(false),
    [logoutError, setLogoutError] = useState('');
  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (open ? 'open' : '')}>
        <Link className="brand" to="/">
          <ScanSearch size={28} />
          <span>
            CareerLens<span className="brand-ai">AI</span>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <div className="workspace-label">
          <span className="avatar">{user?.name[0]}</span>
          <div>
            <small>YOUR PERSONAL WORKSPACE</small>
            <strong>{user?.name}</strong>
          </div>
        </div>
        <p className="nav-label">YOUR NEXT CHAPTER</p>
        <nav aria-label="Main navigation">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={22} />
          <h3>Evidence over guesswork.</h3>
          <p>Connect your experience to the role. Keep every claim honest.</p>
          <Link to="/analyses">
            Start an analysis <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-footer">
          <span className="avatar">
            {user?.name
              .split(' ')
              .map((s) => s[0])
              .slice(0, 2)
              .join('')}
          </span>
          <div>
            <strong>{user?.name}</strong>
            <small>Private workspace</small>
          </div>
          <button
            className="icon-button"
            aria-label="Log out"
            onClick={() => logout().catch((e) => setLogoutError(e.message))}
          >
            <LogOut size={18} />
          </button>
        </div>
        <ErrorMessage message={logoutError} />
      </aside>
      {open && (
        <button className="scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />
      )}
      <div className="main-shell">
        <div className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <span>
            Workspace <span className="divider">/</span> A clearer next move
          </span>
          <span className="top-status">
            <i /> {loading ? 'Connecting…' : 'Private by design'}
          </span>
        </div>
        <main>
          {user?.email === 'demo@careerlens.app' && (
            <div className="demo-banner">
              <ShieldCheck size={17} />
              <span>
                Fictional demo workspace. CVs are read-only.{' '}
                <Link to="/privacy">Create your own account</Link> before sharing personal
                information.
              </span>
            </div>
          )}
          {loading ? (
            <div className="loading" role="status">
              Loading your workspace…
            </div>
          ) : error ? (
            <div className="error-state">
              <ErrorMessage message={error} />
              <button className="button" onClick={() => void reload()}>
                Retry connection
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
        <footer className="page-footer">
          CareerLens AI <span>Advisory insights. Your decisions.</span>
          <span>Never a hiring probability.</span>
        </footer>
      </div>
    </div>
  );
}
