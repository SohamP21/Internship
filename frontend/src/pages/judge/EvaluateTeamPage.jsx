import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJudgeAssignmentsApi, submitEvaluationApi, getMyEvaluationApi } from '../../api/evaluationApi';

const EvaluateTeamPage = () => {
  const { eventId, assignmentId } = useParams();
  const navigate                  = useNavigate();

  const [assignment,  setAssignment]  = useState(null);
  const [rubric,      setRubric]      = useState([]);
  const [evaluation,  setEvaluation]  = useState(null);
  const [scores,      setScores]      = useState([]);
  const [remarks,     setRemarks]     = useState('');
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // Check if already evaluated
        try {
          const evalRes = await getMyEvaluationApi(assignmentId);
          setEvaluation(evalRes.data.data);
          setLoading(false);
          return;
        } catch {
          // Not yet evaluated — continue
        }

        // Load assignments list to find this one + get rubric
        const res  = await getJudgeAssignmentsApi(eventId);
        const list = res.data.data;
        const found = list.find((a) => a._id === assignmentId);

        if (!found) {
          setError('Assignment not found');
          setLoading(false);
          return;
        }

        setAssignment(found);

        // Rubric comes from the populated eventId on the assignment
        const criteria = found.eventId?.rubric?.criteria || [];
        setRubric(criteria);

        // Initialise scores array from rubric
        setScores(criteria.map((c) => ({
          criterionName: c.name,
          maxScore:      c.maxScore,
          score:         0,
        })));
      } catch {
        setError('Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId, assignmentId]);

  const updateScore = (index, value) => {
    const max  = rubric[index].maxScore;
    const val  = Math.min(Math.max(0, Number(value)), max);
    setScores((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score: val };
      return updated;
    });
  };

  const totalScore    = scores.reduce((sum, s) => sum + s.score, 0);
  const maxTotalScore = rubric.reduce((sum, c) => sum + c.maxScore, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all scores filled
    for (const s of scores) {
      if (s.score === undefined || s.score === null || s.score === '') {
        return setError('Please fill in all scores before submitting');
      }
    }

    setSubmitting(true);
    try {
      await submitEvaluationApi(assignmentId, { scores, remarks });
      navigate(`/judge/events/${eventId}/assignments`);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>;

  // ── Read-only view after submission ──────────────────────────
  if (evaluation) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 1rem' }}>
        <button onClick={() => navigate(`/judge/events/${eventId}/assignments`)} style={backBtn}>
          ← Back to Assignments
        </button>
        <h2 style={{ margin: '12px 0 4px' }}>Evaluation Submitted</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 28 }}>
          This evaluation is final and cannot be edited.
        </p>

        <div style={{ border: '1px solid #9FE1CB', borderRadius: 10, padding: 24, background: '#f4fdf9' }}>
          {evaluation.scores.map((s, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: i < evaluation.scores.length - 1 ? '1px solid #e8f5f1' : 'none',
            }}>
              <span style={{ fontSize: 15, color: '#333' }}>{s.criterionName}</span>
              <span style={{ fontWeight: 600, fontSize: 16, color: '#0F6E56' }}>
                {s.score} <span style={{ color: '#999', fontWeight: 400, fontSize: 13 }}>/ {s.maxScore}</span>
              </span>
            </div>
          ))}

          {/* Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16, paddingTop: 16, borderTop: '2px solid #9FE1CB',
          }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total Score</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#0F6E56' }}>
              {evaluation.totalScore}
            </span>
          </div>

          {evaluation.remarks && (
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#e8f5f1', borderRadius: 6 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#555' }}>Remarks</p>
              <p style={{ margin: 0, fontSize: 14, color: '#333' }}>{evaluation.remarks}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) return <p style={{ padding: 40, color: 'red' }}>{error}</p>;
  if (!assignment) return <p style={{ padding: 40, color: 'red' }}>Assignment not found</p>;

  const reg = assignment.registrationId;

  // ── Evaluation form ───────────────────────────────────────────
  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 1rem' }}>
      <button onClick={() => navigate(`/judge/events/${eventId}/assignments`)} style={backBtn}>
        ← Back to Assignments
      </button>

      <h2 style={{ margin: '12px 0 4px' }}>Evaluate Team</h2>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>{reg?.teamName}</p>
      <p style={{ color: '#A32D2D', fontSize: 13, marginBottom: 28 }}>
        ⚠ Once submitted this evaluation is final and cannot be changed.
      </p>

      {error && (
        <div style={{ padding: '10px 16px', background: '#FCEBEB', color: '#A32D2D', borderRadius: 6, marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Team info */}
      <div style={{ padding: 16, border: '1px solid #e0e0e0', borderRadius: 8, marginBottom: 24 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 14 }}>Team Details</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {reg?.domains?.map((d) => (
            <span key={d} style={{ padding: '2px 10px', background: '#EEF2FF', color: '#4F46E5', borderRadius: 20, fontSize: 12 }}>{d}</span>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {reg?.members?.map((m, i) => (
            <span key={i} style={{ fontSize: 12, background: '#f5f5f5', padding: '3px 10px', borderRadius: 6 }}>
              {m.name}{m.role ? ` — ${m.role}` : ''}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {reg?.pptUrl      && <a href={reg.pptUrl}      target="_blank" rel="noreferrer" style={linkStyle}>📄 PPT</a>}
          {reg?.abstractUrl && <a href={reg.abstractUrl}  target="_blank" rel="noreferrer" style={linkStyle}>📝 Abstract</a>}
          {reg?.githubLink  && <a href={reg.githubLink}   target="_blank" rel="noreferrer" style={linkStyle}>🔗 GitHub</a>}
          {reg?.driveLink   && <a href={reg.driveLink}    target="_blank" rel="noreferrer" style={linkStyle}>🎥 Drive</a>}
        </div>
      </div>

      {/* Rubric scoring form */}
      <form onSubmit={handleSubmit}>
        <p style={{ fontWeight: 600, fontSize: 15, margin: '0 0 16px' }}>Rubric Scores</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {rubric.map((criterion, i) => (
            <div key={i} style={{ padding: 16, border: '1px solid #e0e0e0', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontWeight: 600, fontSize: 14 }}>{criterion.name}</label>
                <span style={{ fontSize: 13, color: '#666' }}>Max: {criterion.maxScore} pts</span>
              </div>

              {/* Score slider + number input together */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  min={0}
                  max={criterion.maxScore}
                  value={scores[i]?.score ?? 0}
                  onChange={(e) => updateScore(i, e.target.value)}
                  style={{ flex: 1 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number"
                    min={0}
                    max={criterion.maxScore}
                    value={scores[i]?.score ?? 0}
                    onChange={(e) => updateScore(i, e.target.value)}
                    style={{
                      width: 56, padding: '6px 8px', border: '1px solid #ccc',
                      borderRadius: 6, fontSize: 15, fontWeight: 600,
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: 13, color: '#999' }}>/ {criterion.maxScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Running total */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px', background: '#EEF2FF', borderRadius: 8, marginBottom: 20,
        }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Total Score</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#4F46E5' }}>
            {totalScore}
            <span style={{ fontSize: 14, color: '#999', fontWeight: 400 }}> / {maxTotalScore}</span>
          </span>
        </div>

        {/* Remarks */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
            Remarks <span style={{ fontWeight: 400, color: '#999' }}>(optional)</span>
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Any comments or feedback for the team..."
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', border: '1px solid #ccc',
              borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        </div>

        <button type="submit" disabled={submitting} style={{ ...primaryBtn, width: '100%', padding: 14, fontSize: 15 }}>
          {submitting ? 'Submitting...' : 'Submit Final Evaluation'}
        </button>
      </form>
    </div>
  );
};

const primaryBtn = { background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' };
const backBtn    = { background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontSize: 14, padding: 0 };
const linkStyle  = { color: '#4F46E5', textDecoration: 'none', padding: '3px 10px', background: '#EEF2FF', borderRadius: 6, fontSize: 13 };

export default EvaluateTeamPage;