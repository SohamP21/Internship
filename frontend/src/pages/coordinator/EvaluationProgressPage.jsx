import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageShell from '../../components/ui/PageShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { getOpsSummaryApi } from '../../api/eventApi';
import { unwrapApiData } from '../../api/authApi';
import { useWorkspace } from '../../context/WorkspaceContext';

function ProgressBar({ label, value }) {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="ds-ops-progress">
      <div className="ds-ops-progress__head">
        <span>{label}</span>
        <span className="ui-muted">{v}%</span>
      </div>
      <div className="ds-sidebar__progress-bar" role="presentation">
        <div className="ds-sidebar__progress-fill" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export default function EvaluationProgressPage() {
  const { activeEventId } = useWorkspace();
  const location = useLocation();
  const [ops, setOps] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOpsSummaryApi(activeEventId || undefined)
      .then((res) => {
        if (!cancelled) setOps(unwrapApiData(res));
      })
      .catch(() => {
        if (!cancelled) setOps(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeEventId]);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    const el = document.getElementById(hash);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash, ops]);

  if (loading) {
    return (
      <Layout maxWidth="wide" viewport="command">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading evaluation metrics…</span>
        </div>
      </Layout>
    );
  }

  const c = ops?.counts || {};
  const p = ops?.percentages || {};
  const judges = ops?.judges || [];
  const readiness = ops?.submissionReadiness;

  return (
    <Layout maxWidth="wide" viewport="command" pageTitle="Evaluation progress">
      <PageShell>
        <div className="ds-ops-header">
          <h2 className="gradient-text">Evaluation progress</h2>
          <p className="ui-muted">
            Coverage and judge workload{ops?.event?.title ? ` · ${ops.event.title}` : ''}.
          </p>
        </div>

        <div className="ds-ops-grid ds-mt-24">
          <Card>
            <h3 className="ds-quick-title">Coverage</h3>
            <ProgressBar label="Teams with ≥1 assignment" value={p.assignmentCoverage} />
            <ProgressBar label="Assignments evaluated" value={p.evaluationCoverage} />
            <ul className="ds-ops-stats ui-muted ds-mt-16">
              <li>Registrations: {c.totalRegistrations ?? '—'}</li>
              <li>Assignments: {c.totalAssigned ?? '—'}</li>
              <li>Evaluations submitted: {c.totalEvaluationsSubmitted ?? '—'}</li>
              <li>Pending evaluations: {c.pendingEvaluations ?? '—'}</li>
            </ul>
          </Card>

          {readiness ? (
            <Card>
              <h3 className="ds-quick-title">Team submission readiness</h3>
              <p className="ds-quick-copy ui-muted">
                Deliverables attached to registrations for this event.
              </p>
              <ul className="ds-ops-stats">
                <li>PPT uploaded: {readiness.withPpt}</li>
                <li>Abstract uploaded: {readiness.withAbstract}</li>
                <li>Repo / drive link: {readiness.withLinks}</li>
                <li>All three: {readiness.complete}</li>
              </ul>
            </Card>
          ) : null}
        </div>

        <div id="judges" className="ds-mt-24">
          <h3 className="ds-events-section-title gradient-text">Judge capacity</h3>
          <p className="ui-muted ds-mb-16">
            Balanced workload keeps judging fair. &ldquo;Overloaded&rdquo; is a soft signal (many
            assignments vs. peers).
          </p>
          {judges.length === 0 ? (
            <Card>
              <p className="ui-muted">No judge profiles for this view. Select an event or onboard judges.</p>
            </Card>
          ) : (
            <div className="ds-ops-judge-grid">
              {judges.map((j) => (
                <Card key={j.judgeId}>
                  <div className="ds-ops-judge-head">
                    <strong>{j.name}</strong>
                    <Badge
                      label={j.status}
                      variant={
                        j.status === 'overloaded'
                          ? 'red'
                          : j.status === 'underutilized'
                            ? 'green'
                            : 'blue'
                      }
                    />
                  </div>
                  <p className="ui-muted ds-mt-8">
                    {j.assignments} assignments · cap ~{j.capacity}
                  </p>
                  <div className="ds-sidebar__progress-bar ds-mt-12" role="presentation">
                    <div
                      className="ds-sidebar__progress-fill"
                      style={{ width: `${Math.min(100, (j.assignments / j.capacity) * 100)}%` }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div id="evals" className="ds-mt-24">
          <h3 className="ds-events-section-title gradient-text">Pending evaluations</h3>
          <Card>
            <p className="ds-quick-copy">
              <strong>{c.pendingEvaluations ?? 0}</strong> assignment
              {(c.pendingEvaluations || 0) !== 1 ? 's' : ''} still need judge submissions in this
              scope. Open the assignment board or results when the event is in judging.
            </p>
          </Card>
        </div>
      </PageShell>
    </Layout>
  );
}
