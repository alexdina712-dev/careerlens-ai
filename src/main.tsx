import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { WorkspaceProvider } from './hooks/useWorkspace';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import './styles.css';
const Dashboard = lazy(() => import('./pages/DashboardPage'));
const Cvs = lazy(() => import('./pages/CvsPage'));
const Jobs = lazy(() => import('./pages/JobsPage'));
const Analyses = lazy(() => import('./pages/AnalysesPage'));
const Privacy = lazy(() => import('./pages/PrivacyPage'));
function Protected() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Connecting to your workspace…</div>;
  return user ? (
    <WorkspaceProvider>
      <Layout />
    </WorkspaceProvider>
  ) : (
    <Navigate to="/login" replace />
  );
}
class Boundary extends React.Component<{ children: React.ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>Something went wrong.</h1>
        <p>Your data is still stored. Reload the page to reconnect.</p>
        <button className="button" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById('root')!).render(
  <Boundary>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="loading">Loading CareerLens…</div>}>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route element={<Protected />}>
              <Route index element={<Dashboard />} />
              <Route path="cvs" element={<Cvs />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="analyses" element={<Analyses />} />
              <Route path="analyses/:id" element={<Analyses />} />
              <Route path="privacy" element={<Privacy />} />
              <Route
                path="*"
                element={
                  <div className="empty">
                    <h1>Page not found</h1>
                    <Link to="/">Return to overview</Link>
                  </div>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </Boundary>,
);
