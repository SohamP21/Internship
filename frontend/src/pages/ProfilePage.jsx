import { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import useAuthStore from '../store/authStore';
import { unwrapApiData, updateMeApi } from '../api/authApi';

const roleLabel = {
  coordinator: 'Coordinator',
  participant: 'Participant',
  judge: 'Judge',
};

const ProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const initial = useMemo(
    () => ({
      name: user?.name || '',
    }),
    [user]
  );

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isChanged = form.name.trim() !== initial.name;

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
      const res = await updateMeApi({
        name: form.name.trim(),
      });
      const updated = unwrapApiData(res);
      if (updated) {
        setUser(updated);
      }
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout maxWidth="narrow">
      <div className="page-header">
        <div className="page-header-info">
          <h2 className="gradient-text">Profile</h2>
          <p>Manage your personal information</p>
        </div>
      </div>

      <div className="glass-card no-hover">
        <div style={{ marginBottom: 14, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Role: <strong style={{ color: 'var(--text-secondary)' }}>{roleLabel[user?.role] || user?.role}</strong>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="profile-name">
              Full name
            </label>
            <input
              id="profile-name"
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
            />
            <div className="form-hint">Email cannot be changed.</div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <button type="submit" className="btn btn-primary" disabled={!isChanged || saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default ProfilePage;
