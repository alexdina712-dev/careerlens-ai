import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, ArrowUpRight, Pencil, Trash2, Sparkles, Clock3 } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { api, send } from '../lib/api';
import type { Job, Status } from '../lib/types';
import { statuses } from '../../shared/validation';
import {
  PageHeading,
  Badge,
  Empty,
  Modal,
  ErrorMessage,
  statusLabel,
  date,
} from '../components/ui';
import JobEditor from '../components/JobEditor';
export default function JobsPage() {
  const { jobs, reload } = useWorkspace(),
    [params, setParams] = useSearchParams(),
    [editing, setEditing] = useState<Job | boolean | null>(null),
    [deleting, setDeleting] = useState<Job | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const query = params.get('q') || '',
    status = params.get('status') || '',
    company = params.get('company') || '',
    detail = jobs.find((j) => j.id === params.get('job'));
  const filtered = jobs.filter(
    (j) =>
      (!status || j.status === status) &&
      (!company || j.company === company) &&
      `${j.company} ${j.position} ${j.location} ${j.notes}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  }
  async function change(j: Job, value: Status) {
    setBusy(true);
    setError('');
    try {
      await api('/workspace/jobs/' + j.id + '/status', send('PATCH', { status: value }));
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
      await api('/workspace/jobs/' + deleting.id, send('DELETE'));
      await reload();
      setDeleting(null);
      filter('job', '');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="EVERY OPPORTUNITY, ONE CLEAR PICTURE"
        title="Your applications"
        description="Save the roles that interest you. Keep the next step in view."
      >
        <button className="button" onClick={() => setEditing(true)}>
          <Plus size={17} />
          Add opportunity
        </button>
      </PageHeading>
      <div className="filter-bar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Search applications"
            value={query}
            onChange={(e) => filter('q', e.target.value)}
            placeholder="Search position, company or notes…"
          />
        </label>
        <label className="compact-label">
          Status
          <select value={status} onChange={(e) => filter('status', e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="compact-label">
          Company
          <select value={company} onChange={(e) => filter('company', e.target.value)}>
            <option value="">All companies</option>
            {[...new Set(jobs.map((j) => j.company))].sort().map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {(query || status || company) && (
          <button className="text-button" onClick={() => setParams({})}>
            Clear filters
          </button>
        )}
      </div>
      <ErrorMessage message={error} />
      <section className="panel">
        <div className="panel-heading">
          <h2>
            {filtered.length} opportunit{filtered.length === 1 ? 'y' : 'ies'}
          </h2>
          <span className="muted">Status changes are recorded in your timeline.</span>
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>OPPORTUNITY</th>
                  <th>LOCATION</th>
                  <th>STATUS</th>
                  <th>UPDATED</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <button className="job-title" onClick={() => filter('job', j.id)}>
                        <span className="company-avatar">{j.company[0]}</span>
                        <span>
                          <strong>{j.position}</strong>
                          <small>{j.company}</small>
                        </span>
                      </button>
                    </td>
                    <td>{j.location || 'Not specified'}</td>
                    <td>
                      <select
                        className={'status-select ' + j.status.toLowerCase()}
                        aria-label={'Status for ' + j.position}
                        value={j.status}
                        disabled={busy}
                        onChange={(e) => void change(j, e.target.value as Status)}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{date(j.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <Link
                          className="icon-button"
                          aria-label={'Analyze ' + j.position}
                          to={'/analyses?job=' + j.id}
                        >
                          <Sparkles size={17} />
                        </Link>
                        <button
                          className="icon-button"
                          aria-label={'Edit ' + j.position}
                          onClick={() => setEditing(j)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button danger-text"
                          aria-label={'Delete ' + j.position}
                          onClick={() => setDeleting(j)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              jobs.length
                ? 'No opportunities match these filters'
                : 'Your next chapter starts with one role'
            }
            description={
              jobs.length
                ? 'Try another search or clear your filters.'
                : 'Save a job description to compare it with your CV and track your application.'
            }
          >
            <button
              className="button secondary"
              onClick={() => (jobs.length ? setParams({}) : setEditing(true))}
            >
              {jobs.length ? 'Clear filters' : 'Add opportunity'}
            </button>
          </Empty>
        )}
      </section>
      {editing && (
        <JobEditor
          job={typeof editing === 'object' ? editing : undefined}
          onClose={() => {
            setEditing(null);
            filter('job', '');
          }}
          onSaved={reload}
        />
      )}{' '}
      {detail && !editing && (
        <Modal title={detail.position} onClose={() => filter('job', '')}>
          <div className="job-detail">
            <p>
              <strong>{detail.company}</strong> · {detail.location || 'Location not specified'}
            </p>
            <Badge tone={detail.status.toLowerCase()}>{statusLabel(detail.status)}</Badge>
            {detail.url && (
              <a className="text-link" href={detail.url} target="_blank" rel="noopener noreferrer">
                Original job listing <ArrowUpRight size={16} />
              </a>
            )}
            <h3>Job description</h3>
            <p className="preserve-lines">{detail.description}</p>
            <h3>Your notes</h3>
            <p className="preserve-lines">{detail.notes || 'No notes yet.'}</p>
            <h3>
              <Clock3 size={17} />
              Application timeline
            </h3>
            {detail.events?.map((e) => (
              <div className="timeline-row" key={e.id}>
                <span>{statusLabel(e.status)}</span>
                <small>{date(e.createdAt)}</small>
              </div>
            ))}
            <div className="form-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setEditing(detail);
                }}
              >
                Edit opportunity
              </button>
              <Link className="button" to={'/analyses?job=' + detail.id}>
                Compare with a CV
              </Link>
            </div>
          </div>
        </Modal>
      )}{' '}
      {deleting && (
        <Modal title="Delete this opportunity?" onClose={() => setDeleting(null)}>
          <p>
            {deleting.position} at {deleting.company}, its timeline and associated analyses will be
            permanently deleted. Your CVs remain.
          </p>
          <ErrorMessage message={error} />
          <div className="form-actions">
            <button className="button secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button className="button danger" disabled={busy} onClick={() => void remove()}>
              Delete opportunity permanently
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
