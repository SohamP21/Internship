import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventResultsApi } from '../../api/evaluationApi';

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

  if (loading) return <p style={{ padding: 40 }}>Loading results...</p>;
  if (error)   return <p style={{ padding: 40, color: 'red' }}>{error}</p>;

  const { event, teams } = results;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 1rem' }}>
      <button onClick={() => navigate('/coordinator/dashboard')} style={backBtn}>
        ← Back to Dashboard
      </button>
      <h2 style={{ margin: '12px 0 4px' }}>Results — {event.title}</h2>
      <p style={{ color: '#666', fontSize: 14, margin: '0 0 28px' }}>
        {teams.length} team{teams.length !== 1 ? 's' : ''} evaluated · sorted by average score
      </p>

      {teams.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: 60 }}>
          No evaluations submitted yet.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {teams.map((team, index) => (
          <div key={team.registration._id} style={{
            border: `1px solid ${index === 0 ? '#EF9F27' : '#e0e0e0'}`,
            borderRadius: 10, padding: 20,
            background: index === 0 ? '#FAEEDA' : '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                {/* Rank badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    background: index === 0 ? '#EF9F27' : index === 1 ? '#B4B2A9' : index === 2 ? '#BA7517' : '#eee',
                    color: index < 3 ? '#fff' : '#666',
                  }}>
                    {index + 1}
                  </span>
                  <h3 style={{ margin: 0 }}>{team.registration.teamName}</h3>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#666' }}>
                  {team.judgeCount} judge{team.judgeCount !== 1 ? 's' : ''} evaluated this team
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {team.registration.domains?.map((d) => (
                    <span key={d} style={{ padding: '2px 10px', background: '#EEF2FF', color: '#4F46E5', borderRadius: 20, fontSize: 12 }}>{d}</span>
                  ))}
                </div>
              </div>

              {/* Score display */}
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                <p style={{ margin: '0 0 2px', fontSize: 28, fontWeight: 700, color: index === 0 ? '#BA7517' : '#333' }}>
                  {team.averageScore}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#999' }}>avg score</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666' }}>
                  Total: {team.totalScoreSum}
                </p>
              </div>
            </div>

            {/* Per-judge breakdown */}
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', color: '#555' }}>
                Judge Breakdown
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {team.evaluations.map((ev, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '8px 12px',
                    background: '#f9f9f9', borderRadius: 6, fontSize: 13,
                  }}>
                    <span style={{ color: '#555' }}>{ev.judgeId?.name}</span>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      {ev.scores.map((s, j) => (
                        <span key={j} style={{ color: '#666', fontSize: 12 }}>
                          {s.criterionName}: <strong>{s.score}/{s.maxScore}</strong>
                        </span>
                      ))}
                      <span style={{ fontWeight: 700, color: '#333', marginLeft: 8 }}>
                        {ev.totalScore} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const backBtn = { background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontSize: 14, padding: 0 };

export default ResultsPage;