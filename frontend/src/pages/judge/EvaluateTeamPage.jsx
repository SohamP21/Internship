import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJudgeAssignmentsApi, submitEvaluationApi, getMyEvaluationApi } from '../../api/evaluationApi';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';

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
  const [confirmSubmit, setConfirmSubmit] = useState(false);
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

        const criteria = found.eventId?.rubric?.criteria || [];
        setRubric(criteria);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    for (const s of scores) {
      if (s.score === undefined || s.score === null || s.score === '') {
        return setError('Please fill in all scores before submitting');
      }
    }
    setConfirmSubmit(true);
  };

  const executeEvaluationSubmit = async () => {
    setConfirmSubmit(false);
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

  if (loading) {
    return (
      <Layout maxWidth="narrow">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading…</span>
        </div>
      </Layout>
    );
  }

  // ── Read-only view after submission ──────────────────────────
  if (evaluation) {
    return (
      <Layout maxWidth="narrow">
        <button onClick={() => navigate(`/judge/events/${eventId}/assignments`)} className="back-btn">
          ← Back to Assignments
        </button>
        <h2 className="gradient-text" style={{ marginBottom: 4 }}>Evaluation Submitted</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 28 }}>
          This evaluation is final and cannot be edited.
        </p>

        <div className="glass-card success no-hover animate-scale-in" style={{ padding: '1.5rem' }}>
          {evaluation.scores.map((s, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0',
              borderBottom: i < evaluation.scores.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{s.criterionName}</span>
              <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--success)' }}>
                {s.score} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>/ {s.maxScore}</span>
              </span>
            </div>
          ))}

          {/* Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16, paddingTop: 16, borderTop: '2px solid var(--success-border)',
          }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total Score</span>
            <span className="score-big" style={{ color: 'var(--success)' }}>
              {evaluation.totalScore}
            </span>
          </div>

          {evaluation.remarks && (
            <div style={{
              marginTop: 18, padding: '14px 16px',
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}>
              <div className="section-label">Remarks</div>
              <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                {evaluation.remarks}
              </p>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  if (error && !assignment) {
    return (
      <Layout maxWidth="narrow">
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }

  if (!assignment) {
    return (
      <Layout maxWidth="narrow">
        <div className="alert alert-danger">Assignment not found</div>
      </Layout>
    );
  }

  const reg = assignment.registrationId;

  // ── Evaluation form ───────────────────────────────────────────
  return (
    <Layout maxWidth="narrow">
      <button onClick={() => navigate(`/judge/events/${eventId}/assignments`)} className="back-btn">
        ← Back to Assignments
      </button>

      <h2 className="gradient-text" style={{ marginBottom: 4 }}>Evaluate Team</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 4 }}>{reg?.teamName}</p>
      <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: 28 }}>
        ⚠ Once submitted this evaluation is final and cannot be changed.
      </p>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>⚠ {error}</div>
      )}

      {/* Team info */}
      <div className="glass-card no-hover" style={{ marginBottom: 24 }}>
        <div className="section-label">Team Details</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 10 }}>
          {reg?.domains?.map((d) => (
            <span key={d} className="domain-tag">{d}</span>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {reg?.members?.map((m, i) => (
            <span key={i} className="member-tag">
              {m.name}{m.role ? ` — ${m.role}` : ''}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {reg?.pptUrl      && <a href={reg.pptUrl}      target="_blank" rel="noreferrer" className="deliverable-link">📄 PPT</a>}
          {reg?.abstractUrl && <a href={reg.abstractUrl}  target="_blank" rel="noreferrer" className="deliverable-link">📝 Abstract</a>}
          {reg?.githubLink  && <a href={reg.githubLink}   target="_blank" rel="noreferrer" className="deliverable-link">🔗 GitHub</a>}
          {reg?.driveLink   && <a href={reg.driveLink}    target="_blank" rel="noreferrer" className="deliverable-link">🎥 Drive</a>}
        </div>
      </div>

      {/* Rubric scoring form */}
      <form onSubmit={handleSubmit}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 16px', color: 'var(--text-primary)' }}>
          Rubric Scores
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {rubric.map((criterion, i) => (
            <div key={i} className="glass-card no-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {criterion.name}
                </label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Max: {criterion.maxScore} pts</span>
              </div>

              {/* Score slider + number input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <input
                  type="range"
                  min={0}
                  max={criterion.maxScore}
                  value={scores[i]?.score ?? 0}
                  onChange={(e) => updateScore(i, e.target.value)}
                  style={{ flex: 1 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min={0}
                    max={criterion.maxScore}
                    value={scores[i]?.score ?? 0}
                    onChange={(e) => updateScore(i, e.target.value)}
                    className="form-input"
                    style={{
                      width: 60, padding: '6px 8px',
                      fontSize: '0.95rem', fontWeight: 700,
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {criterion.maxScore}</span>
                </div>
              </div>

              {/* Score bar visual */}
              <div style={{
                marginTop: 8, height: 4, borderRadius: 2,
                background: 'var(--bg-muted)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${((scores[i]?.score ?? 0) / criterion.maxScore) * 100}%`,
                  background: 'var(--gradient-primary)',
                  borderRadius: 2,
                  transition: 'width 0.2s ease',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Running total */}
        <div className="glass-card no-hover" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', marginBottom: 20,
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Total Score</span>
          <span className="score-big" style={{ color: 'var(--primary-light)' }}>
            {totalScore}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}> / {maxTotalScore}</span>
          </span>
        </div>

        {/* Remarks */}
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">
            Remarks <span>(optional)</span>
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Any comments or feedback for the team…"
            rows={3}
            className="form-textarea"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn btn-primary btn-full" style={{ padding: '14px', fontSize: '0.95rem' }}>
          {submitting ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              Submitting…
            </>
          ) : '⚖ Submit Final Evaluation'}
        </button>
      </form>

      <ConfirmDialog
        open={confirmSubmit}
        title="Submit final evaluation?"
        message="Scores and remarks cannot be edited after submission. Make sure everything is correct."
        confirmLabel="Submit evaluation"
        cancelLabel="Review scores"
        variant="danger"
        onConfirm={executeEvaluationSubmit}
        onCancel={() => setConfirmSubmit(false)}
      />
    </Layout>
  );
};

export default EvaluateTeamPage;