import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventByIdApi } from '../../api/eventApi';
import { registerTeamApi } from '../../api/registrationApi';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';

const emptyMember = () => ({ name: '', email: '', role: '' });

const RegisterTeamPage = () => {
  const { eventId } = useParams();
  const navigate    = useNavigate();

  const [event, setEvent]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

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

  const toggleDomain = (d) => {
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!teamName.trim())  return setError('Team name is required');
    if (domains.length === 0) return setError('Select at least one domain');
    for (const m of members) {
      if (!m.name.trim() || !m.email.trim()) {
        return setError('All team members need a name and email');
      }
    }
    setConfirmOpen(true);
  };

  const executeRegistration = async () => {
    setConfirmOpen(false);
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

  if (loading) {
    return (
      <Layout maxWidth="narrow">
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading event…</span>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout maxWidth="narrow">
        <div className="alert alert-danger">{error || 'Event not found'}</div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="narrow">
      <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
      <h2 className="gradient-text" style={{ marginBottom: 4 }}>Register for {event.title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 28 }}>
        Fill in your team details below
      </p>

      {error   && <div className="alert alert-danger" style={{ marginBottom: 18 }}>⚠ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 18 }}>✓ {success}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Team name */}
        <div className="form-group">
          <label className="form-label">Team Name *</label>
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Team Falcon" className="form-input" />
        </div>

        {/* Domain checkboxes */}
        <div className="form-group">
          <label className="form-label">Project Domain(s) * <span>(select all that apply)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {event.domains.map((d) => (
              <label key={d}
                className={`chip-toggle ${domains.includes(d) ? 'active' : ''}`}
                onClick={() => toggleDomain(d)}
              >
                <input type="checkbox" checked={domains.includes(d)} onChange={() => toggleDomain(d)} />
                {domains.includes(d) ? '✓ ' : ''}{d}
              </label>
            ))}
          </div>
        </div>

        {/* Team members */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label className="form-label">Team Members * <span>(1–6)</span></label>
            {members.length < 6 && (
              <button type="button" onClick={addMember} className="btn btn-secondary btn-sm">+ Add Member</button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {members.map((m, i) => (
              <div key={i} className="glass-card no-hover" style={{ position: 'relative' }}>
                <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Member {i + 1} {i === 0 ? '(Team Lead)' : ''}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 2, minWidth: 140 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Full Name *</label>
                    <input value={m.name}
                      onChange={(e) => updateMember(i, 'name', e.target.value)}
                      placeholder="Jane Doe" className="form-input" />
                  </div>
                  <div className="form-group" style={{ flex: 2, minWidth: 140 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Email *</label>
                    <input value={m.email} type="email"
                      onChange={(e) => updateMember(i, 'email', e.target.value)}
                      placeholder="jane@college.edu" className="form-input" />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Role</label>
                    <input value={m.role}
                      onChange={(e) => updateMember(i, 'role', e.target.value)}
                      placeholder="e.g. ML Dev" className="form-input" />
                  </div>
                </div>
                {members.length > 1 && (
                  <button type="button" onClick={() => removeMember(i)} style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1,
                  }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* File uploads */}
        <div className="form-group">
          <label className="form-label">Project Files</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500 }}>PPT / Presentation</label>
              <div className="file-input-wrapper">
                <input type="file" accept=".ppt,.pptx,.pdf"
                  onChange={(e) => setPptFile(e.target.files[0])} />
              </div>
              <span className="form-hint">PDF, PPT, PPTX — max 20MB</span>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Abstract / Report</label>
              <div className="file-input-wrapper">
                <input type="file" accept=".pdf,.doc,.docx"
                  onChange={(e) => setAbstractFile(e.target.files[0])} />
              </div>
              <span className="form-hint">PDF, DOC, DOCX — max 20MB</span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">GitHub Repository Link</label>
            <input value={githubLink} onChange={(e) => setGithubLink(e.target.value)}
              placeholder="https://github.com/yourteam/project" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Google Drive Video Link</label>
            <input value={driveLink} onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/..." className="form-input" />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
          {submitting ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              Submitting…
            </>
          ) : '✦ Submit Registration'}
        </button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Submit team registration?"
        message={`Register "${teamName.trim() || 'your team'}" for this event? You can only register once per event as team lead. Double-check domains and member emails.`}
        confirmLabel="Submit registration"
        cancelLabel="Review form"
        variant="primary"
        onConfirm={executeRegistration}
        onCancel={() => setConfirmOpen(false)}
      />
    </Layout>
  );
};

export default RegisterTeamPage;