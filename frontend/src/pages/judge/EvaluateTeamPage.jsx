import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJudgeAssignmentsApi, submitEvaluationApi, getMyEvaluationApi } from '../../api/evaluationApi';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import FilePreviewModal from '../../components/FilePreviewModal';

const EvaluateTeamPage = () => {
  const { eventId, assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [rubric, setRubric] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [scores, setScores] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState({ open: false, title: '', fileUrl: '' });

  useEffect(() => {
    const load = async () => {
      try {
        try {
          const evalRes = await getMyEvaluationApi(assignmentId);
          setEvaluation(evalRes.data.data);
          setLoading(false);
          return;
        } catch {
          /* not evaluated yet */
        }

        const res = await getJudgeAssignmentsApi(eventId);
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

        setScores(
          criteria.map((c) => ({
            criterionName: c.name,
            maxScore: c.maxScore,
            score: 0,
          }))
        );
      } catch {
        setError('Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId, assignmentId]);

  const updateScore = (index, value) => {
    const max = rubric[index].maxScore;
    const val = Math.min(Math.max(0, Number(value)), max);
    setScores((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], score: val };
      return updated;
    });
  };

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
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

  if (evaluation) {
    return (
      <Layout maxWidth="narrow">
        <button type="button" onClick={() => navigate(`/judge/events/${eventId}/assignments`)} className="back-btn">
          ← Back to Assignments
        </button>
        <h2 className="gradient-text mb-0">Evaluation submitted</h2>
        <p className="eval-page-hint">This evaluation is final and cannot be edited.</p>

        <div className="glass-card success no-hover animate-scale-in eval-readonly-padding">
          {evaluation.scores.map((s, i) => (
            <div key={i} className="eval-score-line">
              <span className="eval-score-name">{s.criterionName}</span>
              <span className="eval-score-val">
                {s.score} <span className="eval-score-denom">/ {s.maxScore}</span>
              </span>
            </div>
          ))}

          <div className="eval-total-banner">
            <span className="eval-total-label">Total score</span>
            <span className="score-big eval-score-val">{evaluation.totalScore}</span>
          </div>

          {evaluation.remarks && (
            <div className="eval-remarks-block">
              <div className="section-label">Remarks</div>
              <p className="eval-remarks-text">{evaluation.remarks}</p>
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

  return (
    <Layout maxWidth="narrow">
      <button type="button" onClick={() => navigate(`/judge/events/${eventId}/assignments`)} className="back-btn">
        ← Back to Assignments
      </button>

      <h2 className="gradient-text mb-0">Evaluate team</h2>
      <p className="form-hint mb-0">{reg?.teamName}</p>
      <p className="eval-warning">Once submitted this evaluation is final and cannot be changed.</p>

      {error && <div className="alert alert-danger alert-spacing">{error}</div>}

      <div className="glass-card no-hover eval-team-panel">
        <div className="section-label">Team details</div>
        <div className="eval-tag-row">
          {reg?.domains?.map((d) => (
            <span key={d} className="domain-tag">
              {d}
            </span>
          ))}
        </div>
        <div className="eval-tag-row">
          {reg?.members?.map((m, i) => (
            <span key={i} className="member-tag">
              {m.name}
              {m.role ? ` — ${m.role}` : ''}
            </span>
          ))}
        </div>
        <div className="eval-deliver-row">
          {reg?.pptUrl && (
            <button
              type="button"
              onClick={() =>
                setPreview({
                  open: true,
                  title: `${reg?.teamName || 'Team'} - PPT`,
                  fileUrl: reg.pptUrl,
                })
              }
              className="deliverable-link"
            >
              PPT
            </button>
          )}
          {reg?.abstractUrl && (
            <button
              type="button"
              onClick={() =>
                setPreview({
                  open: true,
                  title: `${reg?.teamName || 'Team'} - Abstract`,
                  fileUrl: reg.abstractUrl,
                })
              }
              className="deliverable-link"
            >
              Abstract
            </button>
          )}
          {reg?.githubLink && (
            <a href={reg.githubLink} target="_blank" rel="noreferrer" className="deliverable-link">
              GitHub
            </a>
          )}
          {reg?.driveLink && (
            <a href={reg.driveLink} target="_blank" rel="noreferrer" className="deliverable-link">
              Drive
            </a>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <p className="eval-rubric-title">Rubric scores</p>

        <div className="eval-rubric-grid">
          {rubric.map((criterion, i) => (
            <div key={i} className="glass-card no-hover">
              <div className="eval-criterion-top">
                <label className="eval-criterion-label" htmlFor={`crit-range-${i}`}>
                  {criterion.name}
                </label>
                <span className="eval-criterion-max-wrap">
                  {criterion.weight != null && criterion.weight !== '' ? (
                    <span className="eval-criterion-weight-badge">W: {criterion.weight}</span>
                  ) : null}
                  <span className="eval-criterion-max">Max: {criterion.maxScore} pts</span>
                </span>
              </div>

              <div className="eval-slider-row">
                <input
                  id={`crit-range-${i}`}
                  type="range"
                  min={0}
                  max={criterion.maxScore}
                  value={scores[i]?.score ?? 0}
                  onChange={(e) => updateScore(i, e.target.value)}
                  className="eval-range"
                />
                <div className="eval-num-wrap">
                  <input
                    type="number"
                    min={0}
                    max={criterion.maxScore}
                    value={scores[i]?.score ?? 0}
                    onChange={(e) => updateScore(i, e.target.value)}
                    className="form-input eval-num-input"
                  />
                  <span className="eval-num-max">/ {criterion.maxScore}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card no-hover eval-total-run">
          <span className="eval-total-run-label">Total score</span>
          <span className="score-big eval-total-run-value">
            {totalScore}
            <span className="eval-total-run-denom"> / {maxTotalScore}</span>
          </span>
        </div>

        <div className="form-group eval-remarks-group">
          <label className="form-label" htmlFor="eval-remarks">
            Remarks <span>(optional)</span>
          </label>
          <textarea
            id="eval-remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Any comments or feedback for the team…"
            rows={3}
            className="form-textarea"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn btn-primary btn-full">
          {submitting ? (
            <>
              <span className="spinner spinner--sm" aria-hidden />
              Submitting…
            </>
          ) : (
            'Submit final evaluation'
          )}
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
      <FilePreviewModal
        open={preview.open}
        title={preview.title}
        fileUrl={preview.fileUrl}
        onClose={() => setPreview({ open: false, title: '', fileUrl: '' })}
      />
    </Layout>
  );
};

export default EvaluateTeamPage;
