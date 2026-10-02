import { useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Trash2, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { api, send } from '../lib/api';
import type { Analysis } from '../lib/types';
import { PageHeading, ErrorMessage, Empty, Badge, Modal, date } from '../components/ui';
import AnalysisReport from '../components/AnalysisReport';
import { analysisSchema } from '../../shared/validation';
export default function AnalysesPage() {
  const { cvs, jobs, analyses, config, reload } = useWorkspace(),
    { id } = useParams(),
    [params] = useSearchParams(),
    navigate = useNavigate(),
    [cvId, setCvId] = useState(''),
    [versionId, setVersionId] = useState(''),
    [jobId, setJobId] = useState(params.get('job') || ''),
    [external, setExternal] = useState(false),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [deleting, setDeleting] = useState<Analysis | null>(null);
  const cv = cvs.find((c) => c.id === cvId) || cvs[0],
    version = cv?.versions.find((v) => v.id === versionId) || cv?.versions[0],
    job = jobs.find((j) => j.id === jobId) || jobs[0],
    report = analyses.find((a) => a.id === id);
  async function analyze() {
    const parsed = analysisSchema.safeParse({
      cvVersionId: version?.id,
      jobId: job?.id,
      useExternal: external,
      consent,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const a = await api<Analysis>('/workspace/analyses', send('POST', parsed.data));
      await reload();
      navigate('/analyses/' + a.id);
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
      await api('/workspace/analyses/' + deleting.id, send('DELETE'));
      await reload();
      setDeleting(null);
      navigate('/analyses');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (id)
    return (
      <>
        <div className="report-navigation">
          <Link to="/analyses">
            <ArrowLeft size={16} />
            Analysis studio
          </Link>
          {report && (
            <button className="text-button danger-text" onClick={() => setDeleting(report)}>
              <Trash2 size={16} />
              Delete analysis
            </button>
          )}
        </div>
        {report ? (
          <AnalysisReport analysis={report} />
        ) : (
          <Empty
            title="Analysis not found"
            description="It may have been deleted with its CV or job. Your other analyses remain in the studio."
          />
        )}
        {deleting && (
          <Modal title="Delete this analysis?" onClose={() => setDeleting(null)}>
            <p>This saved result will be permanently removed. The CV and job remain.</p>
            <ErrorMessage message={error} />
            <div className="form-actions">
              <button className="button secondary" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button className="button danger" disabled={busy} onClick={() => void remove()}>
                Delete analysis permanently
              </button>
            </div>
          </Modal>
        )}
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="CONNECT YOUR EXPERIENCE TO THE OPPORTUNITY"
        title="The analysis studio"
        description="See the overlap. Understand the gaps. Prepare a more specific application."
      />
      <section className="panel analysis-compose">
        <div className="compose-heading">
          <span className="analysis-icon">
            <Sparkles size={26} />
          </span>
          <div>
            <h2>One CV. One role. A clearer plan.</h2>
            <p>Select the documents you want to compare.</p>
          </div>
          <Badge tone="blue">
            {config.externalAvailable ? 'Local or external AI' : 'No API key needed'}
          </Badge>
        </div>
        {cvs.length && jobs.length ? (
          <>
            <div className="form-grid three">
              <label>
                Choose a CV
                <select
                  value={cv?.id || ''}
                  onChange={(e) => {
                    setCvId(e.target.value);
                    setVersionId('');
                  }}
                >
                  {cvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                      {c.isDefault ? ' · default' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                CV version
                <select value={version?.id || ''} onChange={(e) => setVersionId(e.target.value)}>
                  {cv?.versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      Version {v.number} · {date(v.createdAt)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Choose a saved role
                <select value={job?.id || ''} onChange={(e) => setJobId(e.target.value)}>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.position} · {j.company}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="provider-choice">
              <label>
                Analysis method
                <select
                  value={external ? 'external' : 'local'}
                  onChange={(e) => {
                    setExternal(e.target.value === 'external');
                    setConsent(false);
                  }}
                >
                  <option value="local">Local evidence analyzer · no external transfer</option>
                  {config.externalAvailable && (
                    <option value="external">External AI · {config.externalLabel}</option>
                  )}
                </select>
              </label>
              <p>
                {external
                  ? 'Your selected CV text and job description will be sent to the configured provider. Provider retention policies apply.'
                  : 'Deterministic keyword comparison and practical preparation prompts. This mode is not a generative AI model and sends no CV text to an AI service.'}
              </p>
              {external && (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  I consent to sending this CV and job description to {config.externalLabel} for
                  this analysis.
                </label>
              )}
            </div>
            <ErrorMessage message={error} />
            <div className="compose-footer">
              <span>
                <ShieldCheck size={17} />
                Advisory insights. Never a hiring probability.
              </span>
              <button
                className="button"
                disabled={busy || (external && !consent)}
                onClick={() => void analyze()}
              >
                <Sparkles size={17} />
                {busy ? 'Analyzing your documents…' : 'Analyze this role'}
              </button>
            </div>
          </>
        ) : (
          <Empty
            title="Bring two documents together"
            description="You need at least one CV and one saved job to run an analysis."
          >
            <div className="row-actions">
              <Link className="button secondary" to="/cvs">
                CV library
              </Link>
              <Link className="button" to="/jobs">
                Save an opportunity
              </Link>
            </div>
          </Empty>
        )}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Your saved analyses</h2>
            <p>Evidence preserved at the moment you compared.</p>
          </div>
          <span className="muted">{analyses.length} saved</span>
        </div>
        {analyses.length ? (
          <div className="analysis-list">
            {analyses.map((a) => (
              <Link key={a.id} to={'/analyses/' + a.id}>
                <span className="analysis-icon">
                  <Sparkles size={20} />
                </span>
                <div>
                  <strong>{a.jobSnapshot.position}</strong>
                  <small>
                    {a.jobSnapshot.company} · {a.cvVersion.cv.title} v{a.cvVersion.number} ·{' '}
                    {date(a.createdAt)}
                  </small>
                  <p>
                    {a.result.overlappingSkills.length} recognized overlaps ·{' '}
                    {a.result.missingSkills.length} evidence gaps
                  </p>
                </div>
                <Badge tone="blue">{a.provider === 'local-v1' ? 'Local' : 'External AI'}</Badge>
                <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty
            title="Your first insight is one comparison away"
            description="Saved analyses will appear here, with the CV version and job snapshot they used."
          />
        )}
      </section>
    </>
  );
}
