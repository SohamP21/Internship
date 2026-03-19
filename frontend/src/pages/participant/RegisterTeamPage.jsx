import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByIdApi } from '../../api/eventApi';
import { registerTeamApi } from '../../api/registrationApi';

const emptyMember = () => ({ name: '', email: '', role: '' });

const RegisterTeamPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [event, setEvent]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [teamName,    setTeamName]    = useState('');
  const [domains,     setDomains]     = useState([]);
  const [members,     setMembers]     = useState([emptyMember()]);
  const [githubLink,  setGithubLink]  = useState('');
  const [driveLink,   setDriveLink]   = useState('');
  const [pptFile,     setPptFile]     = useState(null);
  const [abstractFile, setAbstractFile] = useState(null);

  useEffect(() => {
    getEventByIdApi(eventId)
      .then((res) => setEvent(res.data.data))
      .catch(() => setError('Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  // ── Domain checkbox toggle ────────────────────────────────
  const toggleDomain = (d) => {
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  // ── Member helpers ────────────────────────────────────────
  const addMember = () => {
    if (members.length >= 6) return;
    setMembers((p) => [...p, emptyMember()]);
  };

  const removeMember = (i) => {
    if (members.length <= 1) return;
    setMembers((p) => p.filter((_, idx) => idx !== i));
  };

  const updateMember = (i, field, value) => {
    setMembers((prev) => {
      const updated = [...prev];
      updated[i] = { ...updated[i], [field]: value };
      return updated;
    });
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!teamName.trim())  return setError('Team name is required');
    if (domains.length === 0) return setError('Select at least one domain');
    for (const m of members) {
      if (!m.name.trim() || !m.email.trim()) {
        return setError('All team members need a name and email');
      }
    }

    // Build FormData — files + JSON fields together
    const formData = new FormData();
    formData.append('teamName',   teamName);
    formData.append('domains',    JSON.stringify(domains));
    formData.append('members',    JSON.stringify(members));
    formData.append('githubLink', githubLink);
    formData.append('driveLink',  driveLink);
    if (pptFile)      formData.append('ppt',      pptFile);
    if (abstractFile) formData.append('abstract', abstractFile);

    setSubmitting(true);
    try {
      await registerTeamApi(eventId, formData);
      setSuccess('Team registered successfully!');
      navigate('/participant/my-registrations');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p style={{ padding: 40 }}>Loading event...</p>;
  if (!event)  return <p style={{ padding: 40, color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 620, margin: '40px auto', padding: '0 1rem' }}>
      <button onClick={() => navigate(-1)} style={backBtn}>← Back</button>
      <h2 style={{ marginTop: 12 }}>Register for {event.title}</h2>

      {error   && <p style={{ color: 'red',   marginBottom: 16 }}>{error}</p>}
      {success && <p style={{ color: 'green', marginBottom: 16 }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Team name */}
        <div>
          <label style={labelStyle}>Team Name *</label>
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Team Falcon" style={inputStyle} />
        </div>

        {/* Domain checkboxes — pulled from event */}
        <div>
          <label style={labelStyle}>Project Domain(s) * <span style={{ color: '#999', fontWeight: 400 }}>(select all that apply)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            {event.domains.map((d) => (
              <label key={d} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${domains.includes(d) ? '#4F46E5' : '#ddd'}`,
                background: domains.includes(d) ? '#EEF2FF' : '#fff',
                color: domains.includes(d) ? '#4F46E5' : '#555',
                fontSize: 13, userSelect: 'none',
              }}>
                <input type="checkbox" checked={domains.includes(d)}
                  onChange={() => toggleDomain(d)} style={{ display: 'none' }} />
                {d}
              </label>
            ))}
          </div>
        </div>

        {/* Team members */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={labelStyle}>Team Members * <span style={{ color: '#999', fontWeight: 400 }}>(1–6)</span></label>
            {members.length < 6 && (
              <button type="button" onClick={addMember} style={smallSecondaryBtn}>+ Add Member</button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
            {members.map((m, i) => (
              <div key={i} style={{
                padding: 14, border: '1px solid #e0e0e0',
                borderRadius: 8, position: 'relative',
              }}>
                <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 13, color: '#555' }}>
                  Member {i + 1} {i === 0 ? '(Team Lead)' : ''}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: 140 }}>
                    <label style={{ fontSize: 12, color: '#666' }}>Full Name *</label>
                    <input value={m.name}
                      onChange={(e) => updateMember(i, 'name', e.target.value)}
                      placeholder="Jane Doe" style={inputStyle} />
                  </div>
                  <div style={{ flex: 2, minWidth: 140 }}>
                    <label style={{ fontSize: 12, color: '#666' }}>Email *</label>
                    <input value={m.email} type="email"
                      onChange={(e) => updateMember(i, 'email', e.target.value)}
                      placeholder="jane@college.edu" style={inputStyle} />
                  </div>
                  <div style={{ flex: 1, minWidth: 100 }}>
                    <label style={{ fontSize: 12, color: '#666' }}>Role</label>
                    <input value={m.role}
                      onChange={(e) => updateMember(i, 'role', e.target.value)}
                      placeholder="e.g. ML Dev" style={inputStyle} />
                  </div>
                </div>
                {members.length > 1 && (
                  <button type="button" onClick={() => removeMember(i)} style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'none', border: 'none', color: '#999',
                    fontSize: 18, cursor: 'pointer', lineHeight: 1,
                  }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* File uploads */}
        <div>
          <label style={labelStyle}>Project Files</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div>
              <label style={{ fontSize: 13, color: '#555' }}>PPT / Presentation</label>
              <input type="file" accept=".ppt,.pptx,.pdf"
                onChange={(e) => setPptFile(e.target.files[0])}
                style={{ display: 'block', marginTop: 4, fontSize: 13 }} />
              <span style={{ fontSize: 12, color: '#999' }}>PDF, PPT, PPTX — max 20MB</span>
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#555' }}>Abstract / Report</label>
              <input type="file" accept=".pdf,.doc,.docx"
                onChange={(e) => setAbstractFile(e.target.files[0])}
                style={{ display: 'block', marginTop: 4, fontSize: 13 }} />
              <span style={{ fontSize: 12, color: '#999' }}>PDF, DOC, DOCX — max 20MB</span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>GitHub Repository Link</label>
            <input value={githubLink} onChange={(e) => setGithubLink(e.target.value)}
              placeholder="https://github.com/yourteam/project" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Google Drive Video Link</label>
            <input value={driveLink} onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/..." style={inputStyle} />
          </div>
        </div>

        <button type="submit" disabled={submitting} style={primaryBtn}>
          {submitting ? 'Submitting...' : 'Submit Registration'}
        </button>
      </form>
    </div>
  );
};

const labelStyle      = { display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 2 };
const inputStyle      = { display: 'block', width: '100%', padding: '9px 12px', marginTop: 4, border: '1px solid #ccc', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' };
const primaryBtn      = { padding: '12px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer' };
const smallSecondaryBtn = { padding: '6px 12px', background: 'transparent', color: '#4F46E5', border: '1px solid #4F46E5', borderRadius: 6, fontSize: 13, cursor: 'pointer' };
const backBtn         = { background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontSize: 14, padding: 0 };

export default RegisterTeamPage;