import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRegistrationsByEventApi } from '../../api/registrationApi';
import Layout from '../../components/Layout';

const ViewRegistrationsPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getRegistrationsByEventApi(eventId)
      .then((res) => setRegistrations(res.data.data))
      .catch(() => setError('Failed to load registrations'))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <Layout maxWidth="medium">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading registrations…</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="medium">
      <button onClick={() => navigate('/coordinator/dashboard')} className="back-btn">
        ← Back to Dashboard
      </button>
      <div className="page-header" style={{ marginTop: 8 }}>
        <div className="page-header-info">
          <h2 className="gradient-text">Registrations</h2>
          <p>{registrations.length} team{registrations.length !== 1 ? 's' : ''} registered</p>
        </div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

      {registrations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No registrations yet</h3>
          <p>Teams will appear here once they register for this event</p>
        </div>
      )}

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {registrations.map((reg) => (
          <div key={reg._id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{reg.teamName}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Lead: {reg.teamLeadId?.name} ({reg.teamLeadId?.email})
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(reg.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Domains */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {reg.domains.map((d) => (
                <span key={d} className="domain-tag">{d}</span>
              ))}
            </div>

            {/* Members table */}
            <div style={{ marginTop: 16 }}>
              <div className="section-label">Team Members ({reg.members.length})</div>
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-sm)' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reg.members.map((m, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td style={{ color: 'var(--text-primary)' }}>{m.name}</td>
                        <td>{m.email}</td>
                        <td>{m.role || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deliverables */}
            <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {reg.pptUrl      && <a href={reg.pptUrl}      target="_blank" rel="noreferrer" className="deliverable-link">📄 PPT</a>}
              {reg.abstractUrl && <a href={reg.abstractUrl}  target="_blank" rel="noreferrer" className="deliverable-link">📝 Abstract</a>}
              {reg.githubLink  && <a href={reg.githubLink}   target="_blank" rel="noreferrer" className="deliverable-link">🔗 GitHub</a>}
              {reg.driveLink   && <a href={reg.driveLink}    target="_blank" rel="noreferrer" className="deliverable-link">🎥 Drive</a>}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ViewRegistrationsPage;