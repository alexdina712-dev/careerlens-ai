import type { Analysis } from '../lib/types';
import { Badge, date } from './ui';
import { Check, FileSearch, Lightbulb, MessagesSquare, ShieldCheck, Download } from 'lucide-react';
export default function AnalysisReport({ analysis: a }: { analysis: Analysis }) {
  const r = a.result;
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(a, null, 2)], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'careerlens-analysis.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="report">
      <section className="report-hero">
        <div>
          <p className="eyebrow">A CONSIDERED LOOK AT YOUR NEXT MOVE</p>
          <h2>{a.jobSnapshot.position}</h2>
          <p>
            {a.jobSnapshot.company} · {a.jobSnapshot.location || 'Location not specified'}
          </p>
          <div className="tag-row">
            <Badge tone="blue">
              {a.provider === 'local-v1' ? 'Local keyword analysis' : 'External AI analysis'}
            </Badge>
            <Badge>
              {a.cvVersion.cv.title} · v{a.cvVersion.number}
            </Badge>
            <span>{date(a.createdAt)}</span>
          </div>
        </div>
        <button className="button secondary small" onClick={download}>
          <Download size={16} />
          Export JSON
        </button>
      </section>
      <div className="advisory">
        <ShieldCheck size={18} />
        <span>
          Preparation guidance, not a hiring score or employer decision. Review every suggestion.
        </span>
      </div>
      <section className="panel summary-panel">
        <p className="eyebrow">THE OVERALL PICTURE</p>
        <h3>A clearer connection, with context.</h3>
        <p>{r.summary}</p>
      </section>
      <div className="report-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>
                <Check size={18} />
                Recognized overlap
              </h3>
              <p>Terms mentioned in both documents.</p>
            </div>
            <Badge tone="green">{r.overlappingSkills.length} mentions</Badge>
          </div>
          <div className="skill-tags">
            {r.overlappingSkills.length ? (
              r.overlappingSkills.map((s) => (
                <span className="skill matched" key={s}>
                  {s}
                </span>
              ))
            ) : (
              <p>No recognized skill overlap. Read the full documents manually.</p>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>
                <FileSearch size={18} />
                Missing evidence
              </h3>
              <p>Job requirements not mentioned in this CV.</p>
            </div>
            <Badge tone="amber">{r.missingSkills.length} gaps</Badge>
          </div>
          <div className="skill-tags">
            {r.missingSkills.length ? (
              r.missingSkills.map((s) => (
                <span className="skill gap" key={s}>
                  {s}
                </span>
              ))
            ) : (
              <p>
                No gaps found in the recognized dictionary. Other requirements may still be missing.
              </p>
            )}
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h3>Experience alignment</h3>
          <span className="muted">Text statements, not verified history</span>
        </div>
        <div className="experience">
          <div>
            <small>JOB STATES</small>
            <strong>
              {r.experience.requiredYears === null
                ? 'Not explicit'
                : r.experience.requiredYears + ' years'}
            </strong>
          </div>
          <div>
            <small>CV STATES</small>
            <strong>
              {r.experience.statedYears === null
                ? 'Not explicit'
                : r.experience.statedYears + ' years'}
            </strong>
          </div>
          <p>{r.experience.note}</p>
        </div>
      </section>
      <div className="report-grid">
        <section className="panel">
          <div className="panel-heading">
            <h3>
              <Lightbulb size={18} />
              Make the CV more specific
            </h3>
          </div>
          <ol className="recommendations">
            {r.recommendations.map((s, i) => (
              <li key={i}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <p>{s}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h3>
              <MessagesSquare size={18} />
              Prepare for the conversation
            </h3>
          </div>
          <ol className="questions">
            {r.interviewQuestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Keyword comparison</h3>
            <p>Matches from the saved documents.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>TERM</th>
                <th>CV MENTION</th>
                <th>JOB MENTION</th>
              </tr>
            </thead>
            <tbody>
              {r.keywords.map((k) => (
                <tr key={k.term}>
                  <td>{k.term}</td>
                  <td>
                    <Badge tone={k.inCv ? 'green' : 'neutral'}>
                      {k.inCv ? 'Mentioned' : 'Not found'}
                    </Badge>
                  </td>
                  <td>{k.inJob ? 'Mentioned' : 'Not found'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!r.keywords.length && <p className="muted padded">No supported terms recognized.</p>}
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Evidence in your CV</h3>
            <p>Excerpts from the exact version used in this analysis.</p>
          </div>
        </div>
        <div className="evidence">
          {r.evidence.map((e, i) => (
            <div key={i}>
              <Badge tone="blue">{e.skill}</Badge>
              <blockquote>{e.excerpt}</blockquote>
            </div>
          ))}
          {!r.evidence.length && <p>No recognized evidence. Review the CV manually.</p>}
        </div>
      </section>
      <details className="limitations" open>
        <summary>How to interpret this analysis</summary>
        <ul>
          {r.limitations.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <p>
          Analysis uses a saved job snapshot. Later job edits do not rewrite this result. Deleting
          the CV or job deletes this analysis.
        </p>
      </details>
    </div>
  );
}
