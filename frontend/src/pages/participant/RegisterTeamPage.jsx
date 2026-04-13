import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventByIdApi } from '../../api/eventApi';
import { registerTeamApi } from '../../api/registrationApi';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormLayout from '../../components/forms/FormLayout';
import FormGrid from '../../components/forms/FormGrid';
import FormField from '../../components/forms/FormField';

const emptyMember = () => ({ name: '', email: '', role: '' });

const isValidGithub = (v) => {
  const s = String(v || '').trim();
  if (!s) return true;
  return s.startsWith('https://github.com/');
};

const isValidDrive = (v) => {
  const s = String(v || '').trim();
  if (!s) return true;
  return s.startsWith('https://drive.google.com/');
};

const RegisterTeamPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [teamName, setTeamName] = useState('');
  const [domains, setDomains] = useState([]);
  const [members, setMembers] = useState([emptyMember()]);
  const [githubLink, setGithubLink] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [githubLinkError, setGithubLinkError] = useState('');
  const [driveLinkError, setDriveLinkError] = useState('');
  const [pptFile, setPptFile] = useState(null);
  const [abstractFile, setAbstractFile] = useState(null);

  useEffect(() => {
    getEventByIdApi(eventId)
      .then((res) => setEvent(res.data.data))
      .catch(() => setError('Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const toggleDomain = (d) => {
    setDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
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
    if (!teamName.trim()) return setError('Team name is required');
    if (domains.length === 0) return setError('Select at least one domain');
    for (const m of members) {
      if (!m.name.trim() || !m.email.trim()) {
        return setError('All team members need a name and email');
      }
    }
    if (!isValidGithub(githubLink)) {
      setGithubLinkError('Please enter a valid GitHub URL');
      return setError('Please enter a valid GitHub URL');
    }
    if (!isValidDrive(driveLink)) {
      setDriveLinkError('Please enter a valid Google Drive URL');
      return setError('Please enter a valid Google Drive URL');
    }
    setConfirmOpen(true);
  };

  const executeRegistration = async () => {
    setConfirmOpen(false);
    const formData = new FormData();
    formData.append('teamName', teamName);
    formData.append('domains', JSON.stringify(domains));
    formData.append('members', JSON.stringify(members));
    formData.append('githubLink', githubLink);
    formData.append('driveLink', driveLink);
    if (pptFile) formData.append('ppt', pptFile);
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
      <FormLayout leftTitle="Team registration" leftSubtitle="Loading event details…" leftContent={null}>
        <div className="loading-wrapper">
          <div className="spinner" />
          <span className="loading-text">Loading event…</span>
        </div>
      </FormLayout>
    );
  }

  if (!event) {
    return (
      <FormLayout leftTitle="Team registration" leftSubtitle="We could not load this event." leftContent={null}>
        <div className="alert alert-danger">{error || 'Event not found'}</div>
      </FormLayout>
    );
  }

  const leftBody = (
    <>
      <div className="form-profile-badge">Student</div>
      <p className="form-shell__left-subtitle">Ready to participate?</p>
      <div className="form-preview-tags">
        {(event.domains || []).slice(0, 6).map((d) => (
          <span key={d} className="form-preview-tag">
            {d}
          </span>
        ))}
      </div>
    </>
  );

  return (
    <FormLayout
      leftTitle={event.title}
      leftSubtitle="Register your team for this event. Fields below match what coordinators review."
      leftContent={leftBody}
      footer={
        <div className="form-shell__footer form-shell__footer--split">
          <div className="form-footer-left">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost">
              ← Back
            </button>
            <Link to="/participant/dashboard" className="btn btn-ghost">
              Dashboard
            </Link>
          </div>
          <button type="submit" form="register-team-form" disabled={submitting} className="btn btn-primary">
            {submitting ? (
              <>
                <span className="spinner spinner--sm" aria-hidden />
                Submitting…
              </>
            ) : (
              'Submit registration'
            )}
          </button>
        </div>
      }
    >
      <p className="form-section-label">Team details</p>
      <p className="form-hint mb-1">Fill in your team details below.</p>

      {error ? <div className="alert alert-danger alert-spacing">{error}</div> : null}
      {success ? <div className="alert alert-success alert-spacing">{success}</div> : null}

      <form id="register-team-form" onSubmit={handleSubmit}>
        <FormGrid>
          <FormField label="Team name *" htmlFor="rt-name" spanFull>
            <input
              id="rt-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Team Falcon"
              className="form-input"
            />
          </FormField>

          <FormField label="Project domain(s) *" spanFull>
            <span className="form-hint">Select all that apply</span>
            <div className="coop-tag-row domain-tags-flow domain-picker-chips" role="group" aria-label="Project domains">
              {event.domains.map((d, i) => {
                const inputId = `rt-domain-${eventId}-${i}`;
                return (
                  <label key={`${d}-${i}`} htmlFor={inputId} className={`chip-toggle ${domains.includes(d) ? 'active' : ''}`}>
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={domains.includes(d)}
                      onChange={() => toggleDomain(d)}
                    />
                    <span className="chip-toggle__text">{d}</span>
                  </label>
                );
              })}
            </div>
          </FormField>

          <FormField spanFull>
            <div className="form-nav-split">
              <span className="form-field-label mb-0">
                Team members * <span className="form-hint">(1–6)</span>
              </span>
              {members.length < 6 ? (
                <div className="form-nav-split-right">
                  <button type="button" onClick={addMember} className="btn btn-secondary btn-sm">
                    + Add member
                  </button>
                </div>
              ) : null}
            </div>
            <div className="member-list-stack">
              {members.map((m, i) => (
                <div key={i} className="glass-card no-hover member-card-rel form-slot-block">
                  <button
                    type="button"
                    className="member-remove-btn"
                    onClick={() => removeMember(i)}
                    aria-label="Remove member"
                  >
                    ×
                  </button>
                  <p className="form-hint member-card-label">
                    Member {i + 1}
                    {i === 0 ? ' (team lead)' : ''}
                  </p>
                  <FormGrid>
                    <FormField label="Full name *" htmlFor={`m-name-${i}`}>
                      <input
                        id={`m-name-${i}`}
                        value={m.name}
                        onChange={(e) => updateMember(i, 'name', e.target.value)}
                        placeholder="Jane Doe"
                        className="form-input"
                      />
                    </FormField>
                    <FormField label="Email *" htmlFor={`m-email-${i}`}>
                      <input
                        id={`m-email-${i}`}
                        value={m.email}
                        type="email"
                        onChange={(e) => updateMember(i, 'email', e.target.value)}
                        placeholder="jane@college.edu"
                        className="form-input"
                      />
                    </FormField>
                    <FormField label="Role" htmlFor={`m-role-${i}`} spanFull>
                      <input
                        id={`m-role-${i}`}
                        value={m.role}
                        onChange={(e) => updateMember(i, 'role', e.target.value)}
                        placeholder="e.g. ML Dev"
                        className="form-input"
                      />
                    </FormField>
                  </FormGrid>
                </div>
              ))}
            </div>
          </FormField>

          <FormField label="PPT / presentation" htmlFor="rt-ppt">
            <div className="file-input-wrapper">
              <input
                id="rt-ppt"
                type="file"
                accept=".ppt,.pptx,.pdf"
                onChange={(e) => setPptFile(e.target.files[0])}
              />
            </div>
            <span className="form-hint">PDF, PPT, PPTX — max 20MB</span>
          </FormField>

          <FormField label="Abstract / report" htmlFor="rt-abs">
            <div className="file-input-wrapper">
              <input
                id="rt-abs"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setAbstractFile(e.target.files[0])}
              />
            </div>
            <span className="form-hint">PDF, DOC, DOCX — max 20MB</span>
          </FormField>

          <FormField label="GitHub repository" htmlFor="rt-gh">
            <input
              id="rt-gh"
              value={githubLink}
              onChange={(e) => {
                setGithubLink(e.target.value);
                setGithubLinkError('');
              }}
              onBlur={() =>
                setGithubLinkError(
                  isValidGithub(githubLink) ? '' : 'Please enter a valid GitHub URL'
                )
              }
              placeholder="https://github.com/yourteam/project"
              className="form-input"
            />
            {githubLinkError ? <p className="form-inline-error">{githubLinkError}</p> : null}
          </FormField>

          <FormField label="Google Drive video" htmlFor="rt-drive">
            <input
              id="rt-drive"
              value={driveLink}
              onChange={(e) => {
                setDriveLink(e.target.value);
                setDriveLinkError('');
              }}
              onBlur={() =>
                setDriveLinkError(
                  isValidDrive(driveLink) ? '' : 'Please enter a valid Google Drive URL'
                )
              }
              placeholder="https://drive.google.com/..."
              className="form-input"
            />
            {driveLinkError ? <p className="form-inline-error">{driveLinkError}</p> : null}
          </FormField>
        </FormGrid>
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
    </FormLayout>
  );
};

export default RegisterTeamPage;
