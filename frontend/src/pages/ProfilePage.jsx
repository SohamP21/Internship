import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import FormLayout from '../components/forms/FormLayout';
import FormGrid from '../components/forms/FormGrid';
import FormField from '../components/forms/FormField';
import useAuthStore from '../store/authStore';
import { unwrapApiData, updateProfileApi } from '../api/authApi';
import { getMyCertificatesApi, downloadCertificateApi } from '../api/certificateApi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { publicAssetUrl } from '../lib/publicAssetUrl';

const roleLabel = {
  coordinator: 'Coordinator',
  participant: 'Participant',
  judge: 'Judge',
};

const dashboardByRole = {
  coordinator: '/coordinator/dashboard',
  participant: '/participant/dashboard',
  judge: '/judge/dashboard',
};

const GENDER_OPTIONS = [
  { value: '', label: '—' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const certListContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const certListItem = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

function initialsFromName(name) {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ProfilePage = () => {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { push: pushToast } = useToast();

  const initial = useMemo(
    () => ({
      name: user?.name || '',
      phone: user?.phone || '',
      gender: user?.gender || '',
      collegeName: user?.collegeName || '',
    }),
    [user]
  );

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoPreview, setPhotoPreview] = useState(() =>
    user?.avatarUrl ? publicAssetUrl(user.avatarUrl) : ''
  );
  const [newPhotoData, setNewPhotoData] = useState(null);

  const [certs, setCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);

  useEffect(() => {
    setForm(initial);
    setPhotoPreview(user?.avatarUrl ? publicAssetUrl(user.avatarUrl) : '');
    setNewPhotoData(null);
  }, [initial, user?._id, user?.avatarUrl]);

  const isChanged =
    form.name.trim() !== initial.name ||
    (form.phone || '') !== (initial.phone || '') ||
    (form.gender || '') !== (initial.gender || '') ||
    (form.collegeName || '') !== (initial.collegeName || '') ||
    newPhotoData != null;

  useEffect(() => {
    if (user?.role !== 'participant') return;
    let cancelled = false;
    (async () => {
      setCertsLoading(true);
      try {
        const res = await getMyCertificatesApi();
        const raw = res?.data?.data;
        if (!cancelled) setCerts(Array.isArray(raw) ? raw : []);
      } catch {
        if (!cancelled) setCerts([]);
      } finally {
        if (!cancelled) setCertsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  useEffect(() => {
    if (location.hash !== '#my-certificates') return;
    const el = document.getElementById('my-certificates');
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }, [location.hash, certsLoading]);

  const onDownloadCert = async (certificateId) => {
    try {
      const blob = await downloadCertificateApi(certificateId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Certificate.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      pushToast('Could not download certificate', 'error');
    }
  };

  const onPhotoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      pushToast('Please choose an image file', 'error');
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      setNewPhotoData(r.result);
      setPhotoPreview(r.result);
    };
    r.readAsDataURL(f);
    e.target.value = '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: (form.phone || '').trim(),
        collegeName: (form.collegeName || '').trim(),
      };
      if (form.gender) payload.gender = form.gender;
      if (newPhotoData) payload.profilePhoto = newPhotoData;

      const res = await updateProfileApi(payload);
      const updated = unwrapApiData(res);
      if (updated) {
        setUser({ ...user, ...updated });
      }
      setNewPhotoData(null);
      setSuccess('Profile updated successfully');
      pushToast('Profile updated', 'success');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not update profile';
      setError(msg);
      pushToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const avatarDisplay = photoPreview ? (
    <img src={photoPreview} alt="" className="form-profile-avatar-img" />
  ) : (
    initialsFromName(user?.name)
  );

  const leftBody = (
    <>
      <div className="form-profile-avatar" aria-hidden>
        {avatarDisplay}
      </div>
      <span className="form-profile-badge">{roleLabel[user?.role] || user?.role}</span>
      <p className="form-shell__left-subtitle">Keep your profile up to date for certificates and dashboards.</p>
    </>
  );

  return (
    <FormLayout
      leftTitle="Profile"
      leftSubtitle="Manage your personal information"
      leftContent={leftBody}
      footer={
        <div className="form-shell__footer">
          <Link to={dashboardByRole[user?.role] || '/'} className="btn btn-ghost">
            ← Dashboard
          </Link>
        </div>
      }
    >
      <p className="form-section-label">Account</p>

      <form onSubmit={onSubmit}>
        <FormGrid>
          <FormField label="Profile photo" htmlFor="profile-photo" spanFull>
            <input
              id="profile-photo"
              type="file"
              accept="image/*"
              className="form-input"
              onChange={onPhotoChange}
              disabled={saving}
            />
            <p className="form-hint">PNG, JPG, GIF, or WebP — max 400KB on the server.</p>
          </FormField>

          <FormField label="Full name" htmlFor="profile-name">
            <input
              id="profile-name"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
            />
          </FormField>

          <FormField label="Phone" htmlFor="profile-phone">
            <input
              id="profile-phone"
              className="form-input"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={saving}
            />
          </FormField>

          <FormField label="Gender" htmlFor="profile-gender">
            <select
              id="profile-gender"
              className="form-input"
              value={form.gender}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
              disabled={saving}
            >
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value || 'unset'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="College name" htmlFor="profile-college" spanFull>
            <input
              id="profile-college"
              className="form-input"
              value={form.collegeName}
              onChange={(e) => setForm((prev) => ({ ...prev, collegeName: e.target.value }))}
              disabled={saving}
              placeholder="Your institution"
            />
          </FormField>

          <FormField label="Email" htmlFor="profile-email" spanFull>
            <input
              id="profile-email"
              type="email"
              className="form-input form-input-readonly"
              value={user?.email || ''}
              readOnly
              aria-readonly="true"
            />
            <span className="profile-email-lock" title="Email cannot be changed">
              <Lock size={12} strokeWidth={2} aria-hidden />
              Email cannot be changed
            </span>
          </FormField>

          {error ? (
            <FormField spanFull>
              <div className="alert alert-danger">{error}</div>
            </FormField>
          ) : null}
          {success ? (
            <FormField spanFull>
              <div className="alert alert-success">{success}</div>
            </FormField>
          ) : null}

          <FormField spanFull>
            <div className="form-profile-save-row">
              <button type="submit" className="btn btn-primary" disabled={!isChanged || saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </FormField>
        </FormGrid>
      </form>

      {user?.role === 'participant' ? (
        <section
          id="my-certificates"
          className="ui-profile-certs form-profile-certs"
          aria-labelledby="my-certificates-heading"
        >
          <h2 id="my-certificates-heading" className="ui-profile-certs__title">
            My Certificates
          </h2>

          {certsLoading ? (
            <p className="form-hint">Loading certificates…</p>
          ) : certs.length === 0 ? (
            <div className="ui-profile-certs__empty">
              <div className="ui-profile-certs__empty-icon">
                <Trophy size={40} strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mb-0">Complete an event to earn your certificate</p>
            </div>
          ) : (
            <motion.div
              className="ui-profile-certs__grid"
              variants={certListContainer}
              initial="hidden"
              animate="visible"
            >
              {certs.map((c) => (
                <motion.div key={c.certificateId} variants={certListItem}>
                  <Card className="ui-profile-cert-card" glowColor="orange">
                    <Trophy className="ui-profile-cert-card__icon" size={28} strokeWidth={2} aria-hidden />
                    <h3 className="ui-profile-cert-card__event">{c.eventName}</h3>
                    {c.rank ? (
                      <div className="ui-profile-cert-card__rank">Rank: {c.rank}</div>
                    ) : null}
                    <p className="ui-profile-cert-card__date">
                      Issued{' '}
                      {c.issuedAt
                        ? new Date(c.issuedAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </p>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onDownloadCert(c.certificateId)}
                    >
                      Download Certificate
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      ) : null}
    </FormLayout>
  );
};

export default ProfilePage;
