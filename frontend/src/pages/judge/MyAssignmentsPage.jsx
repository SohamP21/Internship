import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJudgeAssignmentsApi } from '../../api/evaluationApi';

const MyAssignmentsPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [eventTitle,  setEventTitle]  = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  useEffect(() => {
    getJudgeAssignmentsApi(eventId)
      .then((res) => {
        const data = res.data.data;
        setAssignments(data);
        if (data.length > 0) setEventTitle(data[0].eventId?.title || '');
      })
      .catch(() => setError('Failed to load assignments'))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <p style={{ padding: 40 }}>Loading assignments...</p>;
  if (error)   return <p style={{ padding: 40, color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 1rem' }}>
      <button onClick={() => navigate('/judge/dashboard')} style={backBtn}>
        ← Back to Dashboard
      </button>
      <h2 style={{ margin: '12px 0 4px' }}>My Assigned Teams</h2>
      <p style={{ margin: '0 0 28px', color: '#666', fontSize: 14 }}>{eventTitle}</p>

      {assignments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          <p style={{ fontSize: 18 }}>No teams assigned to you yet</p>
          <p style={{ fontSize: 14 }}>The coordinator will assign teams during the assigning phase</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {assignments.map((a) => {
          const reg          = a.registrationId;
          const isEvaluated  = !!a.evaluation;

          return (
            <div key={a._id} style={{
              border: `1px solid ${isEvaluated ? '#9FE1CB' : '#e0e0e0'}`,
              borderRadius: 10, padding: 20,
              background: isEvaluated ? '#f4fdf9' : '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ margin: 0 }}>{reg?.teamName}</h3>
                    {isEvaluated && (
                      <span style={{
                        fontSize: 12, color: '#0F6E56', background: '#E1F5EE',
                        padding: '2px 10px', borderRadius: 20, fontWeight: 600,
                      }}>
                        ✓ Evaluated — {a.evaluation.totalScore} pts
                      </span>
                    )}
                  </div>

                  {/* Team domains */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {reg?.domains?.map((d) => (
                      <span key={d} style={{
                        padding: '2px 10px', background: '#EEF2FF',
                        color: '#4F46E5', borderRadius: 20, fontSize: 12,
                      }}>{d}</span>
                    ))}
                  </div>

                  {/* Team members */}
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: '#555', fontWeight: 600 }}>
                    Members ({reg?.members?.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {reg?.members?.map((m, i) => (
                      <span key={i} style={{
                        fontSize: 12, background: '#f5f5f5',
                        padding: '3px 10px', borderRadius: 6, color: '#555',
                      }}>
                        {m.name}{m.role ? ` — ${m.role}` : ''}
                      </span>
                    ))}
                  </div>

                  {/* Deliverable links */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {reg?.pptUrl     && <a href={reg.pptUrl}     target="_blank" rel="noreferrer" style={linkStyle}>📄 PPT</a>}
                    {reg?.abstractUrl && <a href={reg.abstractUrl} target="_blank" rel="noreferrer" style={linkStyle}>📝 Abstract</a>}
                    {reg?.githubLink && <a href={reg.githubLink}  target="_blank" rel="noreferrer" style={linkStyle}>🔗 GitHub</a>}
                    {reg?.driveLink  && <a href={reg.driveLink}   target="_blank" rel="noreferrer" style={linkStyle}>🎥 Drive</a>}
                  </div>
                </div>

                {/* Action button */}
                <div style={{ marginLeft: 16, flexShrink: 0 }}>
                  {isEvaluated ? (
                    <button
                      onClick={() => navigate(`/judge/events/${eventId}/assignments/${a._id}/evaluate`)}
                      style={secondaryBtn}>
                      View Score
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/judge/events/${eventId}/assignments/${a._id}/evaluate`)}
                      style={primaryBtn}>
                      Evaluate
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const primaryBtn   = { padding: '9px 18px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' };
const secondaryBtn = { padding: '9px 16px', background: 'transparent', color: '#4F46E5', border: '1px solid #4F46E5', borderRadius: 6, fontSize: 13, cursor: 'pointer' };
const backBtn      = { background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontSize: 14, padding: 0 };
const linkStyle    = { color: '#4F46E5', textDecoration: 'none', padding: '3px 10px', background: '#EEF2FF', borderRadius: 6, fontSize: 13 };

export default MyAssignmentsPage;