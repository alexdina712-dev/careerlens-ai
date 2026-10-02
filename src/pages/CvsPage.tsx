import { useState } from 'react';
import { Plus, Star, Files, Trash2, Download, ArrowRight, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../hooks/useWorkspace';
import { useAuth } from '../hooks/useAuth';
import { api, send } from '../lib/api';
import type { Cv } from '../lib/types';
import { PageHeading, Badge, Empty, Modal, ErrorMessage, date } from '../components/ui';
import CvEditor from '../components/CvEditor';
export default function CvsPage() {
  const { cvs, reload } = useWorkspace(),
    { user } = useAuth(),
    [selected, setSelected] = useState(''),
    [versionId, setVersionId] = useState(''),
    [edit, setEdit] = useState<Cv | boolean | null>(null),
    [deleting, setDeleting] = useState<Cv | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const cv = cvs.find((c) => c.id === selected) || cvs[0],
    version = cv?.versions.find((v) => v.id === versionId) || cv?.versions[0],
    demo = user?.email === 'demo@careerlens.app';
  async function makeDefault(id: string) {
    setBusy(true);
    setError('');
    try {
      await api('/workspace/cvs/' + id + '/default', send('POST'));
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError('');
    try {
      await api('/workspace/cvs/' + deleting.id, send('DELETE'));
      await reload();
      setDeleting(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!cv || !version) return;
    const url = URL.createObjectURL(new Blob([version.text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'careerlens-cv-v' + version.number + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeading
        eyebrow="THE EVIDENCE BEHIND YOUR APPLICATIONS"
        title="Your CV library"
        description="Keep your story current. Preserve the versions that got you here."
      >
        <button className="button" disabled={demo} onClick={() => setEdit(true)}>
          <Plus size={17} />
          Add CV
        </button>
      </PageHeading>
      <ErrorMessage message={error} />
      {!cvs.length ? (
        <Empty
          title="Start with your experience"
          description="Upload a CV or paste its text. Your first CV becomes your default."
        >
          <button className="button" onClick={() => setEdit(true)}>
            Add your first CV
          </button>
        </Empty>
      ) : (
        <div className="cv-layout">
          <section className="cv-list">
            {cvs.map((c) => (
              <article className={'cv-card ' + (cv?.id === c.id ? 'selected' : '')} key={c.id}>
                <button
                  className="cv-select"
                  onClick={() => {
                    setSelected(c.id);
                    setVersionId('');
                  }}
                >
                  <span className="document-icon">
                    <Files size={25} />
                  </span>
                  <strong>{c.title}</strong>
                  <span>
                    {c.versions.length} version{c.versions.length !== 1 ? 's' : ''} · Updated{' '}
                    {date(c.updatedAt)}
                  </span>
                </button>
                <div className="cv-card-footer">
                  {c.isDefault ? (
                    <Badge tone="blue">
                      <Star size={12} />
                      Default CV
                    </Badge>
                  ) : (
                    <button
                      className="text-button"
                      disabled={demo || busy}
                      onClick={() => void makeDefault(c.id)}
                    >
                      Make default
                    </button>
                  )}
                  <button
                    className="icon-button danger-text"
                    aria-label={'Delete ' + c.title}
                    disabled={demo}
                    onClick={() => setDeleting(c)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))}
            <div className="privacy-note">
              <p>
                <strong>Your documents are private.</strong>
              </p>
              <p>
                Original uploaded files are discarded after extraction. Saved text is visible only
                to your account. Deleting a CV also deletes its versions and analyses.
              </p>
            </div>
          </section>
          {cv && version && (
            <section className="panel cv-detail">
              <div className="panel-heading">
                <div>
                  <h2>{cv.title}</h2>
                  <p>
                    <History size={14} />
                    Version history keeps past evidence intact.
                  </p>
                </div>
                <button
                  className="button secondary small"
                  disabled={demo}
                  onClick={() => setEdit(cv)}
                >
                  New version
                </button>
              </div>
              <div className="cv-toolbar">
                <label>
                  View version
                  <select value={version.id} onChange={(e) => setVersionId(e.target.value)}>
                    {cv.versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        Version {v.number} · {date(v.createdAt)}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="button secondary small" onClick={download}>
                  <Download size={15} />
                  Download text
                </button>
              </div>
              <div className="cv-text">{version.text}</div>
              <div className="panel-bottom">
                <span>
                  {version.text.length.toLocaleString()} characters ·{' '}
                  {version.sourceName || 'Pasted text'}
                </span>
                <Link to="/analyses">
                  Compare with a role <ArrowRight size={16} />
                </Link>
              </div>
            </section>
          )}
        </div>
      )}
      {edit && (
        <CvEditor
          cv={typeof edit === 'object' ? edit : undefined}
          onClose={() => setEdit(null)}
          onSaved={reload}
        />
      )}{' '}
      {deleting && (
        <Modal title="Delete this CV and its analyses?" onClose={() => setDeleting(null)}>
          <p>
            <strong>{deleting.title}</strong> and all its versions and associated analyses will be
            permanently deleted. Your saved jobs remain.
          </p>
          <ErrorMessage message={error} />
          <div className="form-actions">
            <button className="button secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button className="button danger" disabled={busy} onClick={() => void remove()}>
              Delete CV permanently
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
