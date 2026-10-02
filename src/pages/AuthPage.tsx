import { useState, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ScanSearch, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api, send } from '../lib/api';
import type { User } from '../lib/types';
import { registerSchema, loginSchema } from '../../shared/validation';
import { ErrorMessage } from '../components/ui';
export default function AuthPage() {
  const { user, setUser } = useAuth(),
    [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = (register ? registerSchema : loginSchema).safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError('');
    try {
      setUser(
        await api<User>('/auth/' + (register ? 'register' : 'login'), send('POST', parsed.data)),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    setBusy(true);
    setError('');
    try {
      setUser(
        await api<User>(
          '/auth/login',
          send('POST', { email: 'demo@careerlens.app', password: 'CareerLensDemo!2026' }),
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-shell">
      <section className="auth-story">
        <Link className="brand" to="/login">
          <ScanSearch />
          <span>
            CareerLens<span className="brand-ai">AI</span>
          </span>
        </Link>
        <div>
          <p className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</p>
          <h1>
            Your experience.
            <br />
            Their opportunity.
            <br />
            <em>A clearer connection.</em>
          </h1>
          <p>
            Understand what a role asks for, find the evidence in your CV, and make your next
            application count.
          </p>
          <div className="auth-proof">
            <span>
              <Check size={17} /> Evidence-based comparison
            </span>
            <span>
              <Check size={17} /> A focused application tracker
            </span>
            <span>
              <ShieldCheck size={17} /> Your CV stays in your workspace
            </span>
          </div>
          <div className="auth-preview">
            <small>THE ANALYSIS STUDIO</small>
            <strong>Find the story in your experience.</strong>
            <div className="tag-row">
              <span>React</span>
              <span>TypeScript</span>
              <span>REST APIs</span>
            </div>
            <p>Skills, gaps, and interview prompts — without a made-up hiring score.</p>
          </div>
        </div>
        <small>Built for thoughtful applications, not automated decisions.</small>
      </section>
      <section className="auth-form-panel">
        <form onSubmit={submit}>
          <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
          <h2>{register ? 'Make space for your next move.' : 'Welcome back.'}</h2>
          <p>
            {register
              ? 'Create a private workspace for your CVs and opportunities.'
              : 'A little preparation. A more confident next step.'}
          </p>
          {register && (
            <label>
              Full name
              <input name="name" autoComplete="name" required minLength={2} maxLength={80} />
            </label>
          )}
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" required maxLength={254} />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              minLength={register ? 10 : 1}
              maxLength={72}
            />
          </label>
          {register && (
            <small>
              Use at least 10 characters. No CV data is sent to AI unless you choose it.
            </small>
          )}
          <ErrorMessage message={error} />
          <button className="button full" disabled={busy}>
            {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
            <ArrowRight size={18} />
          </button>
          <div className="or">or explore first</div>
          <button
            className="button secondary full"
            type="button"
            disabled={busy}
            onClick={() => void demo()}
          >
            Explore the demo workspace
          </button>
          <p className="auth-switch">
            {register ? 'Already have an account?' : 'New to CareerLens?'}{' '}
            <button
              type="button"
              onClick={() => {
                setRegister(!register);
                setError('');
              }}
            >
              {register ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="fine-print">
            Analysis is advisory, not an employer decision. Demo data is fictional.
          </p>
        </form>
      </section>
    </div>
  );
}
