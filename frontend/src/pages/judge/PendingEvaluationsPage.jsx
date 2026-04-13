import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJudgeAssignmentsApi } from '../../api/evaluationApi';
import Layout from '../../components/Layout';
import PageShell from '../../components/ui/PageShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function PendingEvaluationsPage() {
  const navigate = useNavigate();
  const { activeEventId, opsSummary } = useWorkspace();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeEventId) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getJudgeAssignmentsApi(activeEventId)
      .then((res) => {
        const list = res.data.data || [];
        const pending = list.filter((a) => !a.evaluation);
        if (!cancelled) setRows(pending);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeEventId]);

  const perEvent = opsSummary?.perEvent || [];

  return (
    <Layout maxWidth="wide" viewport="command" pageTitle="Pending evaluations">
      <PageShell>
        <div className="ds-ops-header">
          <h2 className="gradient-text">Pending evaluations</h2>
          <p className="ui-muted">
            Choose an active event in the sidebar to list assignments still awaiting your submission.
          </p>
        </div>

        {!activeEventId ? (
          <div className="ds-mt-24">
            <Card>
              <h3 className="ds-quick-title">Pick an event</h3>
              <p className="ds-quick-copy ui-muted">
                Use &ldquo;Active event&rdquo; at the top of the sidebar, or open an event below.
              </p>
              <ul className="ds-ops-pending-events">
                {perEvent.map((e) => (
                  <li key={String(e._id)}>
                    <span>{e.title}</span>
                    <Badge label={`${e.pendingEvaluations || 0} pending`} status="judging" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/judge/events/${e._id}/assignments`)}
                    >
                      Open
                    </Button>
                  </li>
                ))}
              </ul>
              {perEvent.length === 0 ? (
                <p className="ui-muted ds-mt-16">No events yet — browse and onboard from Events.</p>
              ) : null}
            </Card>
          </div>
        ) : loading ? (
          <div className="loading-wrapper ds-mt-24">
            <div className="spinner" />
            <span className="loading-text">Loading assignments…</span>
          </div>
        ) : rows.length === 0 ? (
          <Card className="ds-mt-24">
            <p className="ui-muted">No pending evaluations for this event. Great work.</p>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="ds-mt-16"
              onClick={() => navigate(`/judge/events/${activeEventId}/assignments`)}
            >
              View all assignments
            </Button>
          </Card>
        ) : (
          <div className="ds-stack-gap ds-mt-24">
            {rows.map((a) => {
              const reg = a.registrationId;
              return (
                <Card key={a._id}>
                  <div className="ds-ops-judge-head">
                    <strong>{reg?.teamName || 'Team'}</strong>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/judge/events/${activeEventId}/assignments/${a._id}/evaluate`
                        )
                      }
                    >
                      Evaluate
                    </Button>
                  </div>
                  <p className="ui-muted ds-mt-8">
                    {(reg?.domains || []).join(', ') || '—'}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </PageShell>
    </Layout>
  );
}
