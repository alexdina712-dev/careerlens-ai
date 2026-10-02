import { useState, type FormEvent } from 'react';
import { Upload, FileText } from 'lucide-react';
import { api, send } from '../lib/api';
import { cvSchema, versionSchema } from '../../shared/validation';
import type { Cv } from '../lib/types';
import { Modal, ErrorMessage } from './ui';
export default function CvEditor({
  cv,
  onClose,
  onSaved,
}: {
  cv?: Cv;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [text, setText] = useState(cv?.versions[0]?.text || ''),
    [title, setTitle] = useState(cv?.title || ''),
    [sourceName, setSourceName] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('File exceeds the 2 MB limit.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const data = await api<{ text: string; sourceName: string }>('/workspace/cvs/extract', {
        method: 'POST',
        body: form,
      });
      setText(data.text);
      setSourceName(data.sourceName);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    const input = cv
      ? { text, sourceName: sourceName || undefined }
      : { title, text, sourceName: sourceName || undefined };
    const parsed = (cv ? versionSchema : cvSchema).safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api(
        cv ? '/workspace/cvs/' + cv.id + '/versions' : '/workspace/cvs',
        send('POST', parsed.data),
      );
      await onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={cv ? 'Save a new CV version' : 'Add a CV'} onClose={onClose}>
      <form onSubmit={save} className="form-stack">
        <p className="muted">
          {cv
            ? 'Previous versions stay intact. Analyses keep the version they originally used.'
            : 'Paste your CV or extract text from a document. Review the text before saving.'}
        </p>
        {!cv && (
          <label>
            CV title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </label>
        )}
        <label className="upload-zone">
          <Upload size={22} />
          <strong>{busy ? 'Reading your document…' : 'Upload PDF, DOCX or TXT'}</strong>
          <span>2 MB maximum · text-based PDFs up to 25 pages</span>
          <input
            aria-label="Upload CV file"
            type="file"
            accept=".pdf,.docx,.txt"
            disabled={busy}
            onChange={(e) => void upload(e.target.files?.[0])}
          />
        </label>
        {sourceName && (
          <p className="file-note">
            <FileText size={16} />
            {sourceName} — text extracted; original file is discarded.
          </p>
        )}
        <label>
          CV text
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            required
            minLength={50}
            maxLength={50000}
            placeholder="Your skills, projects, work experience and education…"
          />
        </label>
        <small>
          {text.length.toLocaleString()} / 50,000 characters. Check extraction accuracy before
          saving.
        </small>
        <ErrorMessage message={error} />
        <div className="form-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button" disabled={busy}>
            {busy ? 'Working…' : cv ? 'Save new version' : 'Save CV'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
