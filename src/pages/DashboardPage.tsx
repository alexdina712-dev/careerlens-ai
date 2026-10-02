import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Send,
  MessagesSquare,
  Files,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { PageHeading, Badge, Empty, statusLabel, date } from '../components/ui';
import { statuses } from '../../shared/validation';
export default function DashboardPage() {
  const { user } = useAuth(),
    { jobs, cvs, analyses } = useWorkspace();
  const active = jobs.filter((j) => !['ARCHIVED', 'REJECTED'].includes(j.status));
  const stats = [
    ['Active opportunities', active.length, BriefcaseBusiness],
    ['Applications sent', jobs.filter((j) => j.appliedAt).length, Send],
    [
      'Interview conversations',
      jobs.filter((j) => j.status === 'INTERVIEW').length,
      MessagesSquare,
    ],
    ['CVs in your library', cvs.length, Files],
  ] as const;
  return (
    <>
      <PageHeading
        eyebrow="YOUR CAREER, WITH A LITTLE MORE CLARITY"
        title={'A clearer next move, ' + user?.name.split(' ')[0] + '.'}
        description="Your opportunities, preparation, and progress in one considered workspace."
      >
        <Link className="button" to="/analyses">
          <Sparkles size={17} />
          New analysis
        </Link>
      </PageHeading>
      <div className="insight-banner">
        <div className="insight-icon">
          <Sparkles />
        </div>
        <div>
          <h3>Preparation is progress.</h3>
          <p>
            {analyses.length
              ? `You have ${analyses.length} saved analyses to turn into more specific applications.`
              : 'Start with a CV and one opportunity. Find the evidence, then make your next move.'}
          </p>
        </div>
        <Link to="/analyses">
          Open the studio <ArrowUpRight size={17} />
        </Link>
      </div>
      <section className="stats">
        {stats.map(([label, value, Icon]) => (
          <article className="stat" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={18} />
            </div>
            <strong>{value}</strong>
            <small>From your workspace</small>
          </article>
        ))}
      </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Opportunities in focus</h2>
              <p>Your most recently updated applications.</p>
            </div>
            <Link to="/jobs">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          {active.length ? (
            <div className="opportunity-list">
              {active.slice(0, 4).map((j) => (
                <Link to={'/jobs?job=' + j.id} key={j.id}>
                  <span className="company-avatar">{j.company[0]}</span>
                  <div>
                    <strong>{j.position}</strong>
                    <small>
                      {j.company} · {j.location || 'Location not specified'}
                    </small>
                  </div>
                  <Badge tone={j.status.toLowerCase()}>{statusLabel(j.status)}</Badge>
                  <ArrowUpRight size={17} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="Your next opportunity belongs here"
              description="Save a job description to start tracking your applications."
            >
              <Link className="button secondary" to="/jobs">
                Add a job
              </Link>
            </Empty>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your application journey</h2>
              <p>Real status counts, no predictions.</p>
            </div>
            <BriefcaseBusiness size={20} />
          </div>
          <div className="journey">
            <strong>
              {jobs.length}
              <small>saved opportunities</small>
            </strong>
            <div className="stacked-chart" aria-label="Applications by status">
              {statuses.map((s, i) => (
                <span
                  key={s}
                  style={{
                    flex: jobs.filter((j) => j.status === s).length || 0,
                    background: ['#a6b6cc', '#607fa7', '#c3a16b', '#538b79', '#b78383', '#bfc2c8'][
                      i
                    ],
                  }}
                />
              ))}
            </div>
            {statuses.map((s, i) => (
              <div className="journey-row" key={s}>
                <span>
                  <i
                    style={{
                      background: [
                        '#a6b6cc',
                        '#607fa7',
                        '#c3a16b',
                        '#538b79',
                        '#b78383',
                        '#bfc2c8',
                      ][i],
                    }}
                  />
                  {statusLabel(s)}
                </span>
                <strong>{jobs.filter((j) => j.status === s).length}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recently explored</h2>
              <p>Insights you can put to work.</p>
            </div>
            <Link to="/analyses">
              All analyses <ArrowRight size={16} />
            </Link>
          </div>
          {analyses.length ? (
            <div className="analysis-list">
              {analyses.slice(0, 3).map((a) => (
                <Link key={a.id} to={'/analyses/' + a.id}>
                  <span className="analysis-icon">
                    <ScanIcon />
                  </span>
                  <div>
                    <strong>{a.jobSnapshot.position}</strong>
                    <small>
                      {a.jobSnapshot.company} · {date(a.createdAt)}
                    </small>
                    <p>
                      {a.result.overlappingSkills.length} skill mentions ·{' '}
                      {a.result.missingSkills.length} evidence gaps
                    </p>
                  </div>
                  <ArrowUpRight size={17} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="Turn a job description into a plan"
              description="Compare your CV and save practical preparation notes."
            />
          )}
        </section>
        <section className="panel next-steps">
          <p className="eyebrow">A THOUGHTFUL NEXT STEP</p>
          <h2>
            Make your experience
            <br />
            easier to understand.
          </h2>
          <p>
            Choose a CV, save a role, and connect the two. Keep the evidence specific and the claims
            honest.
          </p>
          <div>
            <CheckCircle2 size={18} />
            Use examples you can explain.
          </div>
          <div>
            <CheckCircle2 size={18} />
            Treat missing skills as learning prompts.
          </div>
          <Link className="button secondary" to="/cvs">
            Review your CV library <ArrowRight size={17} />
          </Link>
        </section>
      </div>
    </>
  );
}
function ScanIcon() {
  return <Sparkles size={20} />;
}
