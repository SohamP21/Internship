import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAssignmentBoardApi, assignTeamApi, removeAssignmentApi } from '../../api/assignmentApi';

const AssignTeamsPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [board,       setBoard]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [actionError, setActionError] = useState('');

  // Which registration is currently selected (left panel)
  const [selectedRegId, setSelectedRegId] = useState(null);

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

  // ── Assign ────────────────────────────────────────────────
  const handleAssign = async (judgeId) => {
    if (!selectedRegId) return;
    setActionError('');
    try {
      await assignTeamApi(eventId, {
        registrationId: selectedRegId,
        judgeId,
      });
      await fetchBoard(); // refresh board
    } catch (err) {
      setActionError(err.response?.data?.message || 'Assignment failed');
    }
  };

  // ── Remove assignment ─────────────────────────────────────
  const handleRemove = async (assignmentId) => {
    setActionError('');
    try {
      await removeAssignmentApi(assignmentId);
      await fetchBoard();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to remove assignment');
    }
  };

  if (loading) return <p style={{ padding: 40 }}>Loading assignment board...</p>;
  if (error)   return <p style={{ padding: 40, color: 'red' }}>{error}</p>;

  const { registrations, judgeProfiles, assignmentMap } = board;
  const selectedReg = registrations.find((r) => r._id === selectedRegId);

  // Which judges are domain-compatible with the selected team
  const compatibleJudgeIds = selectedReg
    ? new Set(
        judgeProfiles
          .filter((jp) =>
            jp.domains.some((d) => selectedReg.domains.includes(d))
          )
          .map((jp) => jp.judgeId._id)
      )
    : new Set();

  // Which judges are already assigned to the selected team
  const assignedToSelected = selectedRegId
    ? (assignmentMap[selectedRegId] || [])
    : [];

  const alreadyAssignedJudgeIds = new Set(
    assignedToSelected.map((a) => a.judgeId)
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <button onClick={() => navigate('/coordinator/dashboard')} style={backBtn}>
            ← Back to Dashboard
          </button>
          <h2 style={{ margin: '8px 0 4px' }}>Assign Teams to Judges</h2>
          <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
            {board.event.title} &nbsp;·&nbsp;
            <span style={{ color: '#854F0B', fontWeight: 600 }}>
              {registrations.length} teams &nbsp;·&nbsp; {judgeProfiles.length} judges
            </span>
          </p>
        </div>
      </div>

      {actionError && (
        <div style={{ margin: '12px 0', padding: '10px 16px', background: '#FCEBEB', color: '#A32D2D', borderRadius: 6, fontSize: 14 }}>
          {actionError}
        </div>
      )}

      {/* Instructions */}
      <div style={{ margin: '16px 0', padding: '12px 16px', background: '#EEF2FF', borderRadius: 8, fontSize: 13, color: '#4F46E5' }}>
        <strong>How to assign:</strong> Click a team on the left to select it →
        Compatible judges highlight on the right → Click <strong>Assign</strong> to link them.
        A team can be assigned to multiple judges.
      </div>

      {registrations.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: 60 }}>
          No teams have registered for this event yet.
        </p>
      )}

      {judgeProfiles.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>
          No judges have signed up for this event yet.
        </p>
      )}

      {/* Two-column layout */}
      {registrations.length > 0 && judgeProfiles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 20 }}>

          {/* ── LEFT: Teams ── */}
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#333' }}>
              Teams ({registrations.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {registrations.map((reg) => {
                const isSelected      = selectedRegId === reg._id;
                const assignedJudges  = assignmentMap[reg._id] || [];
                const assignedCount   = assignedJudges.length;

                return (
                  <div
                    key={reg._id}
                    onClick={() => setSelectedRegId(isSelected ? null : reg._id)}
                    style={{
                      padding: 14,
                      border: `2px solid ${isSelected ? '#4F46E5' : '#e0e0e0'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isSelected ? '#EEF2FF' : '#fff',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: 14 }}>
                          {reg.teamName}
                        </p>
                        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#666' }}>
                          Lead: {reg.teamLeadId?.name}
                        </p>
                        {/* Team domains */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {reg.domains.map((d) => (
                            <span key={d} style={{
                              padding: '2px 8px', background: '#EEF2FF',
                              color: '#4F46E5', borderRadius: 20, fontSize: 11,
                            }}>{d}</span>
                          ))}
                        </div>
                      </div>
                      {/* Assignment count badge */}
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 10px',
                        borderRadius: 20, flexShrink: 0, marginLeft: 8,
                        background: assignedCount > 0 ? '#EAF3DE' : '#f5f5f5',
                        color:      assignedCount > 0 ? '#3B6D11' : '#999',
                      }}>
                        {assignedCount} judge{assignedCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Show which judges are assigned to this team */}
                    {assignedCount > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {assignedJudges.map((a) => {
                          const jp = judgeProfiles.find(
                            (p) => p.judgeId._id === a.judgeId
                          );
                          return jp ? (
                            <span key={a.assignmentId} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 11, padding: '2px 8px',
                              background: '#fff', border: '1px solid #ddd', borderRadius: 20,
                            }}>
                              {jp.judgeId.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemove(a.assignmentId);
                                }}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: '#A32D2D', fontSize: 13, lineHeight: 1, padding: 0,
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

          {/* ── RIGHT: Judges ── */}
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, color: '#333' }}>
              Judges ({judgeProfiles.length})
              {selectedReg && (
                <span style={{ fontWeight: 400, fontSize: 13, color: '#666', marginLeft: 8 }}>
                  — showing compatibility with <strong>{selectedReg.teamName}</strong>
                </span>
              )}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {judgeProfiles.map((jp) => {
                const jId          = jp.judgeId._id;
                const isCompatible = selectedReg ? compatibleJudgeIds.has(jId) : true;
                const isAssigned   = alreadyAssignedJudgeIds.has(jId);

                // Domains that overlap with selected team
                const matchingDomains = selectedReg
                  ? jp.domains.filter((d) => selectedReg.domains.includes(d))
                  : [];

                return (
                  <div key={jp._id} style={{
                    padding: 14,
                    border: `2px solid ${
                      isAssigned   ? '#1D9E75' :
                      selectedReg && isCompatible  ? '#4F46E5' :
                      selectedReg && !isCompatible ? '#f0f0f0' :
                      '#e0e0e0'
                    }`,
                    borderRadius: 8,
                    background: isAssigned   ? '#E1F5EE' :
                                selectedReg && isCompatible  ? '#EEF2FF' :
                                selectedReg && !isCompatible ? '#fafafa' :
                                '#fff',
                    opacity: selectedReg && !isCompatible ? 0.55 : 1,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: 14 }}>
                          {jp.judgeId.name}
                        </p>
                        <p style={{ margin: '0 0 6px', fontSize: 12, color: '#666' }}>
                          {jp.judgeId.email} &nbsp;·&nbsp; Slot {jp.slotNumber}
                        </p>
                        {/* Judge domains — highlight matching ones */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {jp.domains.map((d) => {
                            const isMatch = matchingDomains.includes(d);
                            return (
                              <span key={d} style={{
                                padding: '2px 8px', borderRadius: 20, fontSize: 11,
                                background: isMatch ? '#4F46E5' : '#f0f0f0',
                                color:      isMatch ? '#fff'    : '#666',
                                fontWeight: isMatch ? 600 : 400,
                              }}>{d}</span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Assign / Already assigned button */}
                      <div style={{ flexShrink: 0, marginLeft: 8 }}>
                        {isAssigned ? (
                          <span style={{
                            fontSize: 12, color: '#0F6E56', background: '#E1F5EE',
                            padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                          }}>
                            ✓ Assigned
                          </span>
                        ) : selectedReg && isCompatible ? (
                          <button
                            onClick={() => handleAssign(jId)}
                            style={{
                              padding: '6px 14px', background: '#4F46E5', color: '#fff',
                              border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            Assign
                          </button>
                        ) : selectedReg && !isCompatible ? (
                          <span style={{ fontSize: 11, color: '#bbb' }}>
                            Domain mismatch
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#bbb' }}>
                            Select a team first
                          </span>
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
    </div>
  );
};

const backBtn = {
  background: 'none', border: 'none', color: '#4F46E5',
  cursor: 'pointer', fontSize: 14, padding: 0,
};

export default AssignTeamsPage;