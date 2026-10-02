import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, FileLock2, Trash2, Database, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api, send } from '../lib/api';
import { PageHeading, Modal, ErrorMessage } from '../components/ui';
export default function PrivacyPage() {
  const { user, setUser, logout } = useAuth(),
    navigate = useNavigate(),
    [open, setOpen] = useState(false),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    demo = user?.email === 'demo@careerlens.app';
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await api('/workspace/account', { ...send('DELETE', { password }) });
      setUser(null);
      navigate('/login');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR INFORMATION. YOUR CONTROL."
        title="Privacy & account"
        description="Understand what is stored, what is shared, and how to remove it."
      />
      <div className="privacy-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <FileLock2 size={20} />
              Private documents
            </h2>
          </div>
          <div className="padded">
            <p>
              CV text and version history are scoped to your account. Every API request checks
              ownership, including referenced CVs and jobs.
            </p>
            <p>
              Original uploads are held in memory for extraction, then discarded. Only the extracted
              text you choose to save is stored. We do not publish your CV or provide public
              document links.
            </p>
            <p>
              Deleting a CV removes all its versions and associated analyses. Deleting a job removes
              its analyses and application timeline.
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <ExternalLink size={20} />
              Optional external AI
            </h2>
          </div>
          <div className="padded">
            <p>
              Local analysis sends no document text to an external AI service. It is a deterministic
              keyword tool, not an AI model.
            </p>
            <p>
              If the administrator configures an OpenAI-compatible provider, you can explicitly
              choose it and consent before each comparison. That provider receives the selected CV
              and job description; its privacy and retention policies apply.
            </p>
            <p>Your password and other CV versions are never included in those requests.</p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <Database size={20} />
              Storage and limits
            </h2>
          </div>
          <div className="padded">
            <p>
              Passwords are securely hashed. Sessions use HttpOnly cookies and database token
              digests. Production traffic uses HTTPS.
            </p>
            <p>
              Accounts can store 10 CVs with up to 20 versions each, 200 jobs and 200 analyses.
              Uploads are limited to 2 MB; text extraction has memory and time limits. Scanned PDFs
              need OCR elsewhere or pasted text.
            </p>
            <p>
              Deletion removes live database records. Hosting-provider backup retention is separate;
              this portfolio demo is not intended for sensitive real-world employment records.
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <ShieldCheck size={20} />
              Your account
            </h2>
          </div>
          <div className="padded">
            <strong>{user?.name}</strong>
            <p>{user?.email}</p>
            {demo ? (
              <>
                <p>
                  This shared account contains fictional data. Personal CV uploads and account
                  deletion are disabled.
                </p>
                <button
                  className="button"
                  onClick={() =>
                    logout()
                      .then(() => navigate('/login'))
                      .catch((e) => setError(e.message))
                  }
                >
                  Leave demo and create an account
                </button>
              </>
            ) : (
              <>
                <p>
                  Deleting your account permanently removes its CVs, versions, saved jobs, analyses,
                  timelines and sessions. You must confirm your password.
                </p>
                <button className="button danger" onClick={() => setOpen(true)}>
                  <Trash2 size={17} />
                  Delete my account
                </button>
              </>
            )}
            <ErrorMessage message={open ? '' : error} />
          </div>
        </section>
      </div>
      {open && (
        <Modal title="Permanently delete your account?" onClose={() => setOpen(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void remove();
            }}
            className="form-stack"
          >
            <p>All of your CareerLens data will be deleted. This cannot be undone.</p>
            <label>
              Confirm your password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <ErrorMessage message={error} />
            <div className="form-actions">
              <button className="button secondary" type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="button danger" disabled={busy}>
                {busy ? 'Deleting…' : 'Delete my account permanently'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
