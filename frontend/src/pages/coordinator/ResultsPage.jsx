import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventResultsApi } from '../../api/evaluationApi';
import Layout from '../../components/Layout';

const ResultsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const { event, teams, scoringMeta } = results;

  return (
    <Layout maxWidth="medium">
      <button type="button" onClick={() => navigate('/coordinator/dashboard')} className="back-btn">
        ← Back to Dashboard
      </button>
      <div className="page-header" style={{ marginTop: 8 }}>
        <div className="page-header-info">
          <h2 className="gradient-text">Results — {event.title}</h2>
          <p>
            {teams.length} team{teams.length !== 1 ? 's' : ''} with evaluations · ranked by official score
            (0–100) when all assigned judges have submitted.
          </p>
          {scoringMeta?.note ? (
            <p className="form-hint" style={{ marginTop: 8 }}>
              {scoringMeta.note}
            </p>
          ) : null}
        </div>
      </div>

      {teams.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No evaluations yet</h3>
          <p>Judges haven&apos;t submitted any evaluations yet</p>
        </div>
      )}

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {teams.map((team, index) => {
          const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default';
          const proc = team.processedScoring;
          const preview = team.rubricBreakdownPreview;
          const rubricRows = proc?.rubricBreakdown || preview || [];
          const displayScore = proc?.overallScore ?? team.averageRawTotalScore ?? '—';
          const scoreLabel = proc ? 'Official score (0–100)' : 'Avg raw total (provisional)';

          return (
            <div
              key={team.registration._id}
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
                    {team.judgeCount}/{team.expectedJudgeCount ?? team.judgeCount} judge
                    {(team.expectedJudgeCount ?? 0) !== 1 ? 's' : ''} submitted
                    {team.scoringComplete ? ' · complete' : ' · waiting for all judges'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {team.registration.domains?.map((d) => (
                      <span key={d} className="domain-tag">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  <p
                    className="score-big"
                    style={{
                      color: index === 0 ? 'var(--warning)' : 'var(--primary-light)',
                      margin: '0 0 2px',
                    }}
                  >
                    {displayScore}
                  </p>
                  <p className="score-label">{scoreLabel}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Sum of raw totals: {team.totalScoreSum}
                  </p>
                </div>
              </div>

              {rubricRows.length > 0 ? (
                <div style={{ marginTop: 18 }}>
                  <div className="section-label">Rubric — raw vs processed (Olympic trim per criterion)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                    {rubricRows.map((row) => (
                      <div
                        key={row.criterionName}
                        style={{
                          padding: '12px 14px',
                          background: 'var(--bg-elevated)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                          <strong>{row.criterionName}</strong>
                          <span style={{ color: 'var(--text-muted)' }}>
                            weight{' '}
                            {(row.weightPercent != null
                              ? row.weightPercent
                              : (row.weight || 0) * 100
                            ).toFixed(1)}
                            % · max{' '}
                            {row.maxScore}
                          </span>
                        </div>
                        <p style={{ margin: '8px 0 4px', color: 'var(--text-muted)' }}>
                          Raw scores:{' '}
                          {row.rawScoresByJudge?.map((r) => `${r.judgeName ?? '?'}: ${r.score}`).join(' · ') ||
                            '—'}
                        </p>
                        {row.processed ? (
                          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            Trim: {row.processed.trimRule} · dropped low [{row.processed.droppedLow?.join(', ') || '—'}
                            ] · dropped high [
                            {row.processed.droppedHigh?.join(', ') || '—'}] → trimmed mean{' '}
                            <strong style={{ color: 'var(--accent-green)' }}>
                              {row.processed.trimmedMean != null ? row.processed.trimmedMean.toFixed(2) : '—'}
                            </strong>
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={{ marginTop: 18 }}>
                <div className="section-label">Judge breakdown (raw submissions)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                  {team.evaluations.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-secondary)' }}>{ev.judgeId?.name}</span>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                        {ev.scores.map((s, j) => (
                          <span key={j} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {s.criterionName}:{' '}
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {s.score}/{s.maxScore}
                            </strong>
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
