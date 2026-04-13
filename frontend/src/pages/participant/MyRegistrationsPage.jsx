import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRegistrationsApi } from '../../api/registrationApi';
import { getMyScoreApi } from '../../api/evaluationApi';
import useAuthStore from '../../store/authStore';
import Layout from '../../components/Layout';

const BADGE_CLASS = {
  draft:     'badge-draft',
  open:      'badge-open',
  assigning: 'badge-assigning',
  judging:   'badge-judging',
  completed: 'badge-completed',
};

// Score card — fetches and displays score for one registration
const ScoreCard = ({ registrationId }) => {
  const [scoreData, setScoreData] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    getMyScoreApi(registrationId)
      .then((res) => setScoreData(res.data.data))
      .catch(() => setScoreData(null))
      .finally(() => setLoading(false));
  }, [registrationId]);

  if (loading) return (
    <div style={{
      marginTop: 14, padding: '14px 18px',
      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading score…</span>
      </div>
    </div>
  );

  if (!scoreData || !scoreData.evaluated) return (
    <div style={{
      marginTop: 14, padding: '14px 18px',
      background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
    }}>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        ⏳ Not evaluated yet
      </p>
    </div>
  );

  const official = scoreData.scoringComplete && scoreData.averageScore != null;
  const main = official ? scoreData.averageScore : scoreData.averageRawTotalScore;
  const sub = official
    ? 'Final score based on all assigned judges.'
    : `Provisional · ${scoreData.judgeCount}/${scoreData.expectedJudgeCount ?? scoreData.judgeCount} judges submitted`;

  return (
    <div style={{
      marginTop: 14, padding: '16px 18px',
      background: 'var(--success-bg)', borderRadius: 'var(--radius-md)',
      border: '1px solid var(--success-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ textAlign: 'center' }}>
          <p className="score-big" style={{ color: 'var(--success)', margin: 0 }}>
            {main ?? '—'}
          </p>
          <p className="score-label">{official ? 'Official score' : 'Provisional'}</p>
        </div>
        <div style={{ width: 1, height: 36, background: 'var(--success-border)' }} />
        <div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--success)' }}>
            {sub}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────

const MyRegistrationsPage = () => {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const [registrations, setRegistrations] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    getMyRegistrationsApi()
      .then((res) => setRegistrations(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout maxWidth="medium">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading your registrations…</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="medium">
      <div className="page-header">
        <div className="page-header-info">
          <h2 className="gradient-text">My Registrations</h2>
          <p>Welcome back, {user?.name} 👋</p>
        </div>
        <div className="page-header-actions">
          <button onClick={() => navigate('/participant/dashboard')} className="btn btn-secondary">
            Browse Events
          </button>
        </div>
      </div>

      {registrations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3>No registrations yet</h3>
          <p>Browse open events and register your team</p>
          <button onClick={() => navigate('/participant/dashboard')} className="btn btn-primary" style={{ marginTop: 4 }}>
            Browse Events
          </button>
        </div>
      )}

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {registrations.map((reg) => {
          const badgeClass    = BADGE_CLASS[reg.eventId?.status] || 'badge-draft';
          const isJudgingDone = ['judging', 'completed'].includes(reg.eventId?.status);

          return (
            <div key={reg._id} className="glass-card">
              {/* Event + status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{reg.teamName}</h3>
                  <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Event: <strong style={{ color: 'var(--text-primary)' }}>{reg.eventId?.title}</strong>
                  </p>
                  <span className={`badge ${badgeClass}`}>
                    {reg.eventId?.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              {reg.roomNo && String(reg.roomNo).trim() ? (
                <p className="form-hint reg-room-banner mb-0">
                  Assigned room: <strong>{String(reg.roomNo).trim()}</strong>
                </p>
              ) : null}

              {/* Domains */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {reg.domains.map((d) => (
                  <span key={d} className="domain-tag">{d}</span>
                ))}
              </div>

              {/* Members */}
              <div style={{ marginTop: 14 }}>
                <div className="section-label">Team Members ({reg.members.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                  {reg.members.map((m, i) => (
                    <span key={i} className="member-tag">
                      {m.name}{m.role ? ` — ${m.role}` : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {reg.pptUrl      && <a href={reg.pptUrl}      target="_blank" rel="noreferrer" className="deliverable-link">📄 PPT</a>}
                {reg.abstractUrl && <a href={reg.abstractUrl}  target="_blank" rel="noreferrer" className="deliverable-link">📝 Abstract</a>}
                {reg.githubLink  && <a href={reg.githubLink}   target="_blank" rel="noreferrer" className="deliverable-link">🔗 GitHub</a>}
                {reg.driveLink   && <a href={reg.driveLink}    target="_blank" rel="noreferrer" className="deliverable-link">🎥 Drive</a>}
              </div>

              {/* Score */}
              {isJudgingDone && <ScoreCard registrationId={reg._id} />}
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default MyRegistrationsPage;
