import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginApi, parseLoginPayload } from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const dashboardMap = {
  coordinator: '/coordinator/dashboard',
  participant:  '/participant/dashboard',
  judge:        '/judge/dashboard',
};

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth  = useAuthStore((s) => s.setAuth);
  const { theme, toggleTheme } = useThemeStore();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const res = await loginApi(data);
      const payload = parseLoginPayload(res);
      if (!payload) {
        setServerError('Invalid response from server. Check that the API is running on port 5000.');
        return;
      }
      const { token, user } = payload;
      setAuth({ token, user });
      navigate(dashboardMap[user.role]);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Cannot reach the server. Run the backend (port 5000) and open the app via the Vite dev server.'
          : 'Login failed');
      setServerError(msg);
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
        <p className="auth-subtitle">Welcome back — sign in to continue</p>

        {serverError && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            ⚠ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
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
            <div className="password-input-wrap">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                className="form-input"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-emoji"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🐵' : '🙈'}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            {isSubmitting ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Logging in…
              </>
            ) : 'Log In'}
          </button>
        </form>

        <p className="auth-footer">
          No account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>

      <style>{authStyles}</style>
    </div>
  );
};

const authStyles = `
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
  position: fixed;
  top: -30%;
  left: -20%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.auth-ambient-glow-2 {
  position: fixed;
  bottom: -30%;
  right: -20%;
  width: 50%;
  height: 50%;
  background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.auth-theme-toggle {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 10;
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 2.5rem 2rem;
  background: var(--card-bg);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 40px rgba(0,0,0,0.2);
}

.auth-logo {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 4px;
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 4px;
  letter-spacing: -0.03em;
}

.auth-subtitle {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 1.75rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth-footer {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.auth-link {
  color: var(--primary-light);
  font-weight: 600;
}
.auth-link:hover {
  text-decoration: underline;
}

.password-input-wrap {
  position: relative;
}

.password-input-wrap .form-input {
  padding-right: 46px;
}

.password-toggle-emoji {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  padding: 2px 4px;
  cursor: pointer;
  font-size: 1rem;
}
`;

export default LoginPage;