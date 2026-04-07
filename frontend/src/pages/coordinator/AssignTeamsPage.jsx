import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignmentBoardApi, assignTeamApi, removeAssignmentApi } from '../../api/assignmentApi';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';

const AssignTeamsPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [board,       setBoard]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedRegId, setSelectedRegId] = useState(null);
  const [dialog, setDialog] = useState(null);

  const fetchBoard = async () => {
    try {
      const res = await getAssignmentBoardApi(eventId);
      setBoard(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assignment board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBoard(); }, [eventId]);

  const requestAssign = (judgeId, judgeName) => {
    if (!selectedRegId) return;
    setDialog({
      kind: 'assign',
      judgeId,
      judgeName: judgeName || 'this judge',
    });
  };

  const confirmAssign = async () => {
    if (!dialog || dialog.kind !== 'assign' || !selectedRegId) return;
    const { judgeId } = dialog;
    setDialog(null);
    setActionError('');
    try {
      await assignTeamApi(eventId, { registrationId: selectedRegId, judgeId });
      await fetchBoard();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Assignment failed');
    }
  };

  const requestRemove = (assignmentId, judgeName) => {
    setDialog({ kind: 'remove', assignmentId, judgeName });
  };

  const confirmRemove = async () => {
    if (!dialog || dialog.kind !== 'remove') return;
    const { assignmentId } = dialog;
    setDialog(null);
    setActionError('');
    try {
      await removeAssignmentApi(assignmentId);
      await fetchBoard();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove assignment');
    }
  };

  if (loading) {
    return (
      <Layout maxWidth="wide">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading assignment board…</span>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout maxWidth="wide">
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }

  const { registrations, judgeProfiles, assignmentMap } = board;
  const selectedReg = registrations.find((r) => r._id === selectedRegId);

  const compatibleJudgeIds = selectedReg
    ? new Set(
        judgeProfiles
          .filter((jp) => jp.domains.some((d) => selectedReg.domains.includes(d)))
          .map((jp) => jp.judgeId._id)
      )
    : new Set();

  const assignedToSelected = selectedRegId ? (assignmentMap[selectedRegId] || []) : [];
  const alreadyAssignedJudgeIds = new Set(assignedToSelected.map((a) => a.judgeId));

  return (
    <Layout maxWidth="wide">
      <button onClick={() => navigate('/coordinator/dashboard')} className="back-btn">
        ← Back to Dashboard
      </button>

      <div className="page-header" style={{ marginTop: 8 }}>
        <div className="page-header-info">
          <h2 className="gradient-text">Assign Teams to Judges</h2>
          <p>
            {board.event.title} &nbsp;·&nbsp;
            <span style={{ color: 'var(--warning)' }}>
              {registrations.length} teams · {judgeProfiles.length} judges
            </span>
          </p>
        </div>
      </div>

      {actionError && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>{actionError}</div>
      )}

      {/* Instructions */}
      <div className="alert alert-info" style={{ marginBottom: 20 }}>
        💡 <strong>How to assign:</strong> Click a team on the left to select it →
        Compatible judges highlight on the right → Click <strong>Assign</strong> to link them.
      </div>

      {registrations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No teams registered</h3>
          <p>No teams have registered for this event yet.</p>
        </div>
      )}

      {judgeProfiles.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">⚖️</div>
          <h3>No judges available</h3>
          <p>No judges have signed up for this event yet.</p>
        </div>
      )}

      {/* Two-column layout */}
      {registrations.length > 0 && judgeProfiles.length > 0 && (
        <div className="assign-grid">

          {/* LEFT: Teams */}
          <div>
            <div className="section-label" style={{ marginBottom: 12 }}>
              Teams ({registrations.length})
            </div>
            <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {registrations.map((reg) => {
                const isSelected     = selectedRegId === reg._id;
                const assignedJudges = assignmentMap[reg._id] || [];
                const assignedCount  = assignedJudges.length;

                return (
                  <div
                    key={reg._id}
                    onClick={() => setSelectedRegId(isSelected ? null : reg._id)}
                    className={`glass-card ${isSelected ? 'selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {reg.teamName}
                        </p>
                        <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Lead: {reg.teamLeadId?.name}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {reg.domains.map((d) => (
                            <span key={d} className="domain-tag" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{d}</span>
                          ))}
                        </div>
                      </div>
                      <span className={`badge ${assignedCount > 0 ? 'badge-success' : 'badge-default'}`}>
                        {assignedCount} judge{assignedCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {assignedCount > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {assignedJudges.map((a) => {
                          const jp = judgeProfiles.find((p) => p.judgeId._id === a.judgeId);
                          return jp ? (
                            <span key={a.assignmentId} className="member-tag">
                              {jp.judgeId.name}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  requestRemove(a.assignmentId, jp?.judgeId?.name || 'Judge');
                                }}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: 'var(--danger)', fontSize: '0.85rem', lineHeight: 1, padding: 0, marginLeft: 4,
                                }}
                              >×</button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Judges */}
          <div>
            <div className="section-label" style={{ marginBottom: 12 }}>
              Judges ({judgeProfiles.length})
              {selectedReg && (
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 8 }}>
                  — compatibility with <strong style={{ color: 'var(--primary-light)' }}>{selectedReg.teamName}</strong>
                </span>
              )}
            </div>
            <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {judgeProfiles.map((jp) => {
                const jId          = jp.judgeId._id;
                const isCompatible = selectedReg ? compatibleJudgeIds.has(jId) : true;
                const isAssigned   = alreadyAssignedJudgeIds.has(jId);

                const matchingDomains = selectedReg
                  ? jp.domains.filter((d) => selectedReg.domains.includes(d))
                  : [];

                return (
                  <div key={jp._id} className={`glass-card ${isAssigned ? 'success' : ''}`}
                    style={{
                      opacity: selectedReg && !isCompatible ? 0.4 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {jp.judgeId.name}
                        </p>
                        <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {jp.judgeId.email} · Slot {jp.slotNumber}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {jp.domains.map((d) => {
                            const isMatch = matchingDomains.includes(d);
                            return (
                              <span key={d} className={`domain-tag ${isMatch ? 'active' : ''}`}
                                style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                                {d}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0, marginLeft: 8 }}>
                        {isAssigned ? (
                          <span className="badge badge-success">✓ Assigned</span>
                        ) : selectedReg && isCompatible ? (
                          <button
                            type="button"
                            onClick={() => requestAssign(jId, jp.judgeId.name)}
                            className="btn btn-primary btn-sm"
                          >
                            Assign
                          </button>
                        ) : selectedReg && !isCompatible ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mismatch</span>
                        ) : (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Select a team</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      <ConfirmDialog
        open={!!dialog && dialog.kind === 'assign'}
        title="Assign team to judge?"
        message={
          dialog?.kind === 'assign' && selectedReg
            ? `Link ${selectedReg.teamName} to ${dialog.judgeName}? The judge will see this team in their assignments.`
            : ''
        }
        confirmLabel="Assign"
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={confirmAssign}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={!!dialog && dialog.kind === 'remove'}
        title="Remove assignment?"
        message={
          dialog?.kind === 'remove'
            ? `Remove ${dialog.judgeName} from this team? They will no longer evaluate this registration.`
            : ''
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmRemove}
        onCancel={() => setDialog(null)}
      />

      <style>{`
.assign-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 8px;
}
@media (max-width: 768px) {
  .assign-grid {
    grid-template-columns: 1fr;
  }
}
      `}</style>
    </Layout>
  );
};

export default AssignTeamsPage;