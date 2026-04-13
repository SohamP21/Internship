import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRegistrationsApi } from '../../api/registrationApi';
import { getMyScoreApi } from '../../api/evaluationApi';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/Layout';
import PageShell from '../../components/ui/PageShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

function ScoreBlock({ registrationId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyScoreApi(registrationId)
      .then((res) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [registrationId]);

  if (loading) {
    return (
      <div className="ds-score-loading ui-muted">
        <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
        Loading score…
      </div>
    );
  }

  if (!data?.evaluated) {
    return <p className="ui-muted">Not evaluated yet.</p>;
  }

  const official = data.scoringComplete && data.averageScore != null;
  const main = official ? data.averageScore : data.averageRawTotalScore;

  return (
    <div className="ds-score-block">
      <p className="ds-score-avg">{main ?? '—'}</p>
      <p className="ui-muted">
        {official ? (
          <>Official score (0–100) — all assigned judges have submitted.</>
        ) : (
          <>
            Provisional · <strong>{data.judgeCount}</strong>/
            {data.expectedJudgeCount ?? data.judgeCount} judges submitted
          </>
        )}
      </p>
    </div>
  );
}

export default function MyScoresPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyRegistrationsApi()
      .then((res) => setRegs(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout maxWidth="medium" viewport="command">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading scores…</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="medium" viewport="command" pageTitle="My scores">
      <PageShell>
        <div className="ds-ops-header">
          <h2 className="gradient-text">My scores</h2>
          <p className="ui-muted">
            Hello {user?.name?.split(' ')[0] || 'there'} — scores appear after judges submit evaluations.
          </p>
        </div>

        {regs.length === 0 ? (
          <Card className="ds-mt-24">
            <p className="ui-muted">You have no team registrations yet.</p>
            <Button type="button" variant="primary" size="md" className="ds-mt-16" onClick={() => navigate('/participant/dashboard')}>
              Browse events
            </Button>
          </Card>
        ) : (
          <div className="ds-stack-gap ds-mt-24">
            {regs.map((r) => {
              const ev = r.eventId;
              return (
                <Card key={r._id}>
                  <div className="ds-ops-judge-head">
                    <strong>{ev?.title || 'Event'}</strong>
                    {ev?.status ? <Badge label={ev.status} status={ev.status} /> : null}
                  </div>
                  <p className="ui-muted ds-mt-8">Team: {r.teamName}</p>
                  <ScoreBlock registrationId={r._id} />
                </Card>
              );
            })}
          </div>
        )}
      </PageShell>
    </Layout>
  );
}
