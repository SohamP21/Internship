import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRegistrationsApi } from '../../api/registrationApi';
import { getMyScoreApi } from '../../api/evaluationApi';
import useAuthStore from '../../store/authStore';

const STATUS_COLORS = {
  draft:     { bg: '#f1f1f1', color: '#555' },
  open:      { bg: '#EAF3DE', color: '#3B6D11' },
  assigning: { bg: '#FAEEDA', color: '#854F0B' },
  judging:   { bg: '#EEF2FF', color: '#4F46E5' },
  completed: { bg: '#E1F5EE', color: '#0F6E56' },
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
    <div style={scoreBox('#f9f9f9', '#999')}>
      <p style={{ margin: 0, fontSize: 13 }}>Loading score...</p>
    </div>
  );

  if (!scoreData || !scoreData.evaluated) return (
    <div style={scoreBox('#f9f9f9', '#999')}>
      <p style={{ margin: 0, fontSize: 13, color: '#999' }}>
        Not evaluated yet
      </p>
    </div>
  );

  return (
    <div style={scoreBox('#EAF3DE', '#0F6E56')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0F6E56', lineHeight: 1 }}>
            {scoreData.averageScore}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#3B6D11' }}>avg score</p>
        </div>
        <div style={{ width: 1, height: 36, background: '#9FE1CB' }} />
        <div>
          <p style={{ margin: 0, fontSize: 13, color: '#3B6D11' }}>
            Evaluated by <strong>{scoreData.judgeCount}</strong> judge{scoreData.judgeCount !== 1 ? 's' : ''}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#3B6D11' }}>
            Total score sum: <strong>{scoreData.totalScore}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

const scoreBox = (bg, color) => ({
  marginTop: 14, padding: '12px 16px',
  background: bg, borderRadius: 8,
  border: `1px solid ${color === '#999' ? '#e0e0e0' : '#9FE1CB'}`,
});

// ─────────────────────────────────────────────────────────────

const MyRegistrationsPage = () => {
  const navigate = useNavigate();
  const logout   = useAuthStore((s) => s.logout);
  const user     = useAuthStore((s) => s.user);
  const [registrations, setRegistrations] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    getMyRegistrationsApi()
      .then((res) => setRegistrations(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: 40 }}>Loading your registrations...</p>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ margin: 0 }}>My Registrations</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>Welcome, {user?.name}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/participant/dashboard')} style={secondaryBtn}>
            Browse Events
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={secondaryBtn}>
            Logout
          </button>
        </div>
      </div>

      {registrations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <p style={{ fontSize: 18 }}>No registrations yet</p>
          <p style={{ fontSize: 14 }}>Browse open events and register your team</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {registrations.map((reg) => {
          const sc            = STATUS_COLORS[reg.eventId?.status] || STATUS_COLORS.draft;
          const isJudgingDone = ['judging', 'completed'].includes(reg.eventId?.status);

          return (
            <div key={reg._id} style={{
              border: '1px solid #e0e0e0', borderRadius: 10, padding: 20,
            }}>
              {/* Event + status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px' }}>{reg.teamName}</h3>
                  <p style={{ margin: '0 0 8px', color: '#666', fontSize: 14 }}>
                    Event: <strong>{reg.eventId?.title}</strong>
                  </p>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                    fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color,
                  }}>
                    {reg.eventId?.status?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Domains */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {reg.domains.map((d) => (
                  <span key={d} style={{
                    padding: '3px 10px', background: '#EEF2FF',
                    color: '#4F46E5', borderRadius: 20, fontSize: 12,
                  }}>{d}</span>
                ))}
              </div>

              {/* Members */}
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 6px', color: '#555' }}>
                  Team Members ({reg.members.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {reg.members.map((m, i) => (
                    <span key={i} style={{
                      fontSize: 12, color: '#555',
                      background: '#f5f5f5', padding: '4px 10px', borderRadius: 6,
                    }}>
                      {m.name}{m.role ? ` — ${m.role}` : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {reg.pptUrl      && <a href={reg.pptUrl}      target="_blank" rel="noreferrer" style={linkStyle}>📄 PPT</a>}
                {reg.abstractUrl && <a href={reg.abstractUrl}  target="_blank" rel="noreferrer" style={linkStyle}>📝 Abstract</a>}
                {reg.githubLink  && <a href={reg.githubLink}   target="_blank" rel="noreferrer" style={linkStyle}>🔗 GitHub</a>}
                {reg.driveLink   && <a href={reg.driveLink}    target="_blank" rel="noreferrer" style={linkStyle}>🎥 Drive</a>}
              </div>

              {/* Score — only shown when judging has started or completed */}
              {isJudgingDone && (
                <ScoreCard registrationId={reg._id} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const secondaryBtn = { padding: '9px 16px', background: 'transparent', color: '#4F46E5', border: '1px solid #4F46E5', borderRadius: 6, fontSize: 14, cursor: 'pointer' };
const linkStyle    = { color: '#4F46E5', textDecoration: 'none', padding: '4px 10px', background: '#EEF2FF', borderRadius: 6, fontSize: 13 };

export default MyRegistrationsPage;
