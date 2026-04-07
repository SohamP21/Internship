import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '../../api/authApi';
import useThemeStore from '../../store/themeStore';
import ConfirmDialog from '../../components/ConfirmDialog';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  role:     z.enum(['participant', 'judge'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
  judgeAccessCode: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    });
  }
  if (data.role === 'judge' && !data.judgeAccessCode?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['judgeAccessCode'],
      message: 'Judge access code is required',
    });
  }
});

const roleOptions = [
  { value: 'participant', label: 'Participant (Team Lead)', icon: '🚀' },
  { value: 'judge',       label: 'Judge',                   icon: '⚖️' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const pendingPayload = useRef(null);
  const { theme, toggleTheme } = useThemeStore();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: undefined, judgeAccessCode: '' },
  });

  const selectedRole = watch('role');

  const onSubmit = (data) => {
    const { confirmPassword: _confirmPassword, ...payload } = data;
    pendingPayload.current = payload;
    setConfirmOpen(true);
  };

  const confirmAccountCreate = async () => {
    const data = pendingPayload.current;
    setConfirmOpen(false);
    if (!data) return;
    setServerError('');
    setSending(true);
    try {
      await registerApi(data);
      navigate('/login');
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.errors?.length) {
        const errorMessages = resData.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
        setServerError(errorMessages);
      } else {
        setServerError(
          resData?.message ||
            (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
              ? 'Cannot reach the server. Run the backend (port 5000) and open the app via the Vite dev server.'
              : 'Registration failed')
        );
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-ambient-glow" />
      <div className="auth-ambient-glow-2" />

      <button
        className="theme-toggle auth-theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="auth-card animate-scale-in">
        <div className="auth-logo">✦</div>
        <h1 className="auth-title gradient-text">Eventify</h1>
        <p className="auth-subtitle">Create your account to get started</p>

        {serverError && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            ⚠ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              {...register('name')}
              placeholder="Your full name"
              className="form-input"
              autoComplete="name"
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="form-input"
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="Min 6 characters"
              className="form-input"
              autoComplete="new-password"
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Re-enter your password"
              className="form-input"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">I am a…</label>
            <div className="role-selector">
              {roleOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`role-option ${selectedRole === opt.value ? 'active' : ''}`}
                  onClick={() => setValue('role', opt.value, { shouldValidate: true })}
                >
                  <input
                    type="radio"
                    {...register('role')}
                    value={opt.value}
                    style={{ display: 'none' }}
                  />
                  <span className="role-icon">{opt.icon}</span>
                  <span className="role-label">{opt.label}</span>
                </label>
              ))}
            </div>
            {errors.role && <span className="form-error">{errors.role.message}</span>}
          </div>

          {selectedRole === 'judge' && (
            <div className="form-group">
              <label className="form-label">Judge Access Code</label>
              <input
                {...register('judgeAccessCode')}
                type="password"
                placeholder="Enter secret judge code"
                className="form-input"
                autoComplete="one-time-code"
              />
              {errors.judgeAccessCode && (
                <span className="form-error">{errors.judgeAccessCode.message}</span>
              )}
            </div>
          )}

          <button type="submit" disabled={isSubmitting || sending} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            {isSubmitting || sending ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Creating account…
              </>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Create your account?"
        message="You will use this email and password to sign in. Make sure your role is correct before continuing."
        confirmLabel="Create account"
        cancelLabel="Review form"
        variant="primary"
        onConfirm={confirmAccountCreate}
        onCancel={() => setConfirmOpen(false)}
      />

      <style>{`
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}
.auth-ambient-glow {
  position: fixed; top: -30%; left: -20%; width: 60%; height: 60%;
  background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}
.auth-ambient-glow-2 {
  position: fixed; bottom: -30%; right: -20%; width: 50%; height: 50%;
  background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%);
  pointer-events: none; z-index: 0;
}
.auth-theme-toggle { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 10; }
.auth-card {
  position: relative; z-index: 1; width: 100%; max-width: 440px;
  padding: 2.5rem 2rem;
  background: var(--card-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 40px rgba(0,0,0,0.2);
}
.auth-logo { text-align: center; font-size: 2.5rem; margin-bottom: 4px;
  background: var(--gradient-text); -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; background-clip: text; }
.auth-title { text-align: center; font-size: 2rem; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.03em; }
.auth-subtitle { text-align: center; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.75rem; }
.auth-form { display: flex; flex-direction: column; gap: 18px; }
.auth-footer { text-align: center; margin-top: 1.25rem; font-size: 0.85rem; color: var(--text-muted); }
.auth-link { color: var(--primary-light); font-weight: 600; }
.auth-link:hover { text-decoration: underline; }

.role-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.role-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
}
.role-option:hover:not(.active) {
  border-color: var(--primary);
  background: rgba(59,130,246,0.04);
}
.role-option.active {
  border-color: var(--primary);
  background: rgba(59, 130, 246, 0.1);
  box-shadow: 0 0 0 1px var(--primary);
}
.role-icon { font-size: 1.2rem; }
.role-label { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }
      `}</style>
    </div>
  );
};

export default RegisterPage;