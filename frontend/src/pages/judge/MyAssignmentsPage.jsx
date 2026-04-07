import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJudgeAssignmentsApi } from '../../api/evaluationApi';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';

const MyAssignmentsPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [eventTitle,  setEventTitle]  = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [evaluateDialog, setEvaluateDialog] = useState({
    open: false,
    assignmentId: null,
    teamName: '',
  });

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

  if (loading) {
    return (
      <Layout maxWidth="medium">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading assignments…</span>
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

  return (
    <Layout maxWidth="medium">
      <button onClick={() => navigate('/judge/dashboard')} className="back-btn">
        ← Back to Dashboard
      </button>
      <div className="page-header" style={{ marginTop: 8 }}>
        <div className="page-header-info">
          <h2 className="gradient-text">My Assigned Teams</h2>
          <p>{eventTitle}</p>
        </div>
      </div>

      {assignments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No teams assigned yet</h3>
          <p>The coordinator will assign teams during the assigning phase</p>
        </div>
      )}

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {assignments.map((a) => {
          const reg         = a.registrationId;
          const isEvaluated = !!a.evaluation;

          return (
            <div key={a._id} className={`glass-card ${isEvaluated ? 'success' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ margin: 0 }}>{reg?.teamName}</h3>
                    {isEvaluated && (
                      <span className="badge badge-success">
                        ✓ Evaluated — {a.evaluation.totalScore} pts
                      </span>
                    )}
                  </div>

                  {/* Team domains */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {reg?.domains?.map((d) => (
                      <span key={d} className="domain-tag">{d}</span>
                    ))}
                  </div>

                  {/* Team members */}
                  <div className="section-label">Members ({reg?.members?.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 12 }}>
                    {reg?.members?.map((m, i) => (
                      <span key={i} className="member-tag">
                        {m.name}{m.role ? ` — ${m.role}` : ''}
                      </span>
                    ))}
                  </div>

                  {/* Deliverable links */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {reg?.pptUrl     && <a href={reg.pptUrl}     target="_blank" rel="noreferrer" className="deliverable-link">📄 PPT</a>}
                    {reg?.abstractUrl && <a href={reg.abstractUrl} target="_blank" rel="noreferrer" className="deliverable-link">📝 Abstract</a>}
                    {reg?.githubLink && <a href={reg.githubLink}  target="_blank" rel="noreferrer" className="deliverable-link">🔗 GitHub</a>}
                    {reg?.driveLink  && <a href={reg.driveLink}   target="_blank" rel="noreferrer" className="deliverable-link">🎥 Drive</a>}
                  </div>
                </div>

                {/* Action button */}
                <div style={{ marginLeft: 16, flexShrink: 0 }}>
                  {isEvaluated ? (
                    <button
                      onClick={() => navigate(`/judge/events/${eventId}/assignments/${a._id}/evaluate`)}
                      className="btn btn-secondary btn-sm"
                    >
                      View Score
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setEvaluateDialog({
                          open: true,
                          assignmentId: a._id,
                          teamName: reg?.teamName || 'this team',
                        })
                      }
                      className="btn btn-primary btn-sm"
                    >
                      ⚖ Evaluate
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={evaluateDialog.open}
        title="Open evaluation?"
        message={`You are about to score ${evaluateDialog.teamName}. Submitted scores are final and cannot be changed.`}
        confirmLabel="Start evaluation"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={() => {
          const id = evaluateDialog.assignmentId;
          setEvaluateDialog({ open: false, assignmentId: null, teamName: '' });
          if (id) navigate(`/judge/events/${eventId}/assignments/${id}/evaluate`);
        }}
        onCancel={() =>
          setEvaluateDialog({ open: false, assignmentId: null, teamName: '' })
        }
      />
    </Layout>
  );
};

export default MyAssignmentsPage;