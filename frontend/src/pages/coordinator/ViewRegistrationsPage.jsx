import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRegistrationsByEventApi } from '../../api/registrationApi';

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

  if (loading) return <p style={{ padding: 40 }}>Loading registrations...</p>;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 1rem' }}>
      <button onClick={() => navigate('/coordinator/dashboard')} style={backBtn}>← Back to Dashboard</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 28px' }}>
        <h2 style={{ margin: 0 }}>Registrations ({registrations.length})</h2>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {registrations.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', marginTop: 60 }}>No teams have registered yet.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {registrations.map((reg) => (
          <div key={reg._id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px' }}>{reg.teamName}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
                  Lead: {reg.teamLeadId?.name} ({reg.teamLeadId?.email})
                </p>
              </div>
              <span style={{ fontSize: 12, color: '#999' }}>
                {new Date(reg.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Domains */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {reg.domains.map((d) => (
                <span key={d} style={{ padding: '3px 10px', background: '#EEF2FF', color: '#4F46E5', borderRadius: 20, fontSize: 12 }}>{d}</span>
              ))}
            </div>

            {/* Members table */}
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px', color: '#555' }}>
                Team Members ({reg.members.length})
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={th}>#</th>
                    <th style={th}>Name</th>
                    <th style={th}>Email</th>
                    <th style={th}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {reg.members.map((m, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={td}>{i + 1}</td>
                      <td style={td}>{m.name}</td>
                      <td style={td}>{m.email}</td>
                      <td style={td}>{m.role || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Deliverables */}
            <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
              {reg.pptUrl      && <a href={reg.pptUrl}      target="_blank" rel="noreferrer" style={linkStyle}>📄 PPT</a>}
              {reg.abstractUrl && <a href={reg.abstractUrl}  target="_blank" rel="noreferrer" style={linkStyle}>📝 Abstract</a>}
              {reg.githubLink  && <a href={reg.githubLink}   target="_blank" rel="noreferrer" style={linkStyle}>🔗 GitHub</a>}
              {reg.driveLink   && <a href={reg.driveLink}    target="_blank" rel="noreferrer" style={linkStyle}>🎥 Drive</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const backBtn  = { background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontSize: 14, padding: 0 };
const linkStyle = { color: '#4F46E5', textDecoration: 'none', padding: '4px 10px', background: '#EEF2FF', borderRadius: 6 };
const th = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #eee' };
const td = { padding: '8px 10px', color: '#333' };

export default ViewRegistrationsPage;