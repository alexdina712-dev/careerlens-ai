import { useState, type FormEvent } from 'react';
import { api, send } from '../lib/api';
import type { Job } from '../lib/types';
import { jobSchema } from '../../shared/validation';
import { Modal, ErrorMessage } from './ui';
export default function JobEditor({
  job,
  onClose,
  onSaved,
}: {
  job?: Job;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = jobSchema.safeParse({ ...form, url: form.url || null });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api(
        '/workspace/jobs' + (job ? '/' + job.id : ''),
        send(job ? 'PATCH' : 'POST', parsed.data),
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
    <Modal title={job ? 'Edit opportunity' : 'Save an opportunity'} onClose={onClose}>
      <form onSubmit={save} className="form-stack">
        <div className="form-grid">
          <label>
            Company
            <input
              name="company"
              defaultValue={job?.company}
              required
              minLength={2}
              maxLength={100}
            />
          </label>
          <label>
            Position
            <input
              name="position"
              defaultValue={job?.position}
              required
              minLength={2}
              maxLength={120}
            />
          </label>
          <label>
            Location
            <input name="location" defaultValue={job?.location} maxLength={120} />
          </label>
          <label>
            Job URL
            <input
              name="url"
              type="url"
              defaultValue={job?.url || ''}
              placeholder="https://…"
              maxLength={1000}
            />
          </label>
        </div>
        <label>
          Job description
          <textarea
            aria-label="Job description"
            name="description"
            rows={9}
            defaultValue={job?.description}
            required
            minLength={50}
            maxLength={30000}
          />
        </label>
        <label>
          Your notes
          <textarea
            aria-label="Your notes"
            name="notes"
            rows={3}
            defaultValue={job?.notes}
            maxLength={5000}
          />
        </label>
        <p className="muted">Descriptions are saved text. We do not fetch or scrape job URLs.</p>
        <ErrorMessage message={error} />
        <div className="form-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button" disabled={busy}>
            {busy ? 'Saving…' : job ? 'Save changes' : 'Save opportunity'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
