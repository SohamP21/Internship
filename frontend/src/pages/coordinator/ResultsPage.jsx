import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventResultsApi } from '../../api/evaluationApi';
import Layout from '../../components/Layout';

const ResultsPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    getEventResultsApi(eventId)
      .then((res) => setResults(res.data.data))
      .catch(() => setError('Failed to load results'))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <Layout maxWidth="medium">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading results…</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout maxWidth="medium">
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }

  const { event, teams } = results;

  return (
    <Layout maxWidth="medium">
      <button onClick={() => navigate('/coordinator/dashboard')} className="back-btn">
        ← Back to Dashboard
      </button>
      <div className="page-header" style={{ marginTop: 8 }}>
        <div className="page-header-info">
          <h2 className="gradient-text">Results — {event.title}</h2>
          <p>{teams.length} team{teams.length !== 1 ? 's' : ''} evaluated · sorted by average score</p>
        </div>
      </div>

      {teams.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No evaluations yet</h3>
          <p>Judges haven't submitted any evaluations yet</p>
        </div>
      )}

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {teams.map((team, index) => {
          const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default';

          return (
            <div key={team.registration._id}
              className={`glass-card ${index === 0 ? 'warning' : ''}`}
              style={index === 0 ? { border: '1px solid var(--warning-border)' } : {}}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <span className={`rank-badge ${rankClass}`}>{index + 1}</span>
                    <h3 style={{ margin: 0 }}>{team.registration.teamName}</h3>
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {team.judgeCount} judge{team.judgeCount !== 1 ? 's' : ''} evaluated this team
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {team.registration.domains?.map((d) => (
                      <span key={d} className="domain-tag">{d}</span>
                    ))}
                  </div>
                </div>

                {/* Score display */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  <p className="score-big" style={{
                    color: index === 0 ? 'var(--warning)' : 'var(--primary-light)',
                    margin: '0 0 2px',
                  }}>
                    {team.averageScore}
                  </p>
                  <p className="score-label">avg score</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Total: {team.totalScoreSum}
                  </p>
                </div>
              </div>

              {/* Per-judge breakdown */}
              <div style={{ marginTop: 18 }}>
                <div className="section-label">Judge Breakdown</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {team.evaluations.map((ev, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                    }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{ev.judgeId?.name}</span>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        {ev.scores.map((s, j) => (
                          <span key={j} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {s.criterionName}: <strong style={{ color: 'var(--text-primary)' }}>{s.score}/{s.maxScore}</strong>
                          </span>
                        ))}
                        <span style={{ fontWeight: 700, color: 'var(--primary-light)', marginLeft: 8 }}>
                          {ev.totalScore} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
};

export default ResultsPage;