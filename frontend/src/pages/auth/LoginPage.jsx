import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { loginApi, parseLoginPayload } from '../../api/authApi';
import useAuthStore from '../../store/authStore';
import AuthParticles from '../../components/AuthParticles';
import FormLayout from '../../components/forms/FormLayout';
import FormGrid from '../../components/forms/FormGrid';
import FormField from '../../components/forms/FormField';

const schema = z.object({
  email: z.string().trim().email('Invalid email').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const dashboardMap = {
  coordinator: '/coordinator/dashboard',
  participant: '/participant/dashboard',
  judge: '/judge/dashboard',
};

const PORTAL_COPY = {
  participant: {
    title: 'Student access',
    subtitle: 'Sign in to browse events, register your team, and track results.',
  },
  coordinator: {
    title: 'Coordinator portal',
    subtitle: 'Manage events, registrations, assignments, and judging from one workspace.',
  },
  judge: {
    title: 'Judge portal',
    subtitle: 'Secure access for evaluating teams and submitting scores.',
  },
};

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [portal, setPortal] = useState('participant');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const res = await loginApi(data);
      const payload = parseLoginPayload(res);
      if (!payload) {
        setServerError('Invalid response from server. Check that the backend is running and reachable.');
        return;
      }
      const { token, user } = payload;
      const next = dashboardMap[user.role];
      if (!next) {
        setServerError('Your account role is not recognized. Please contact support.');
        return;
      }
      setAuth({ token, user });
      navigate(next);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Cannot connect to the API. For local dev: start the backend on port 5000, set VITE_API_URL empty in frontend/.env (use the Vite /api proxy), then restart the dev server.'
          : 'Login failed');
      setServerError(msg);
    }
  };

  const copy = PORTAL_COPY[portal] || PORTAL_COPY.participant;

  const leftDecor = <AuthParticles className="auth-particles-canvas" />;

  return (
    <FormLayout
      className="form-shell--auth"
      leftTitle={copy.title}
      leftSubtitle={copy.subtitle}
      leftContent={leftDecor}
    >
      <motion.div
        className="auth-form-panel"
        animate={serverError ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.45 }}
      >
        <p className="form-section-label">Sign in</p>

        {serverError ? (
          <div className="alert alert-danger alert-spacing" role="alert">
            {serverError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)}>
          <p className="form-field-label">I am signing in as</p>
          <div className="form-role-cards" role="tablist" aria-label="Portal type">
            {[
              { id: 'participant', label: 'Student', icon: '🎓' },
              { id: 'coordinator', label: 'Coordinator', icon: '📊' },
              { id: 'judge', label: 'Judge', icon: '⚖️' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={portal === r.id}
                className={`form-role-card ${portal === r.id ? 'form-role-card--active' : ''}`}
                onClick={() => setPortal(r.id)}
              >
                <span className="form-role-card__icon" aria-hidden>
                  {r.icon}
                </span>
                {r.label}
              </button>
            ))}
          </div>

          <FormGrid>
            <FormField label="Email" htmlFor="login-email" error={errors.email?.message} spanFull>
              <input
                id="login-email"
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="form-input"
                autoComplete="email"
              />
            </FormField>

            <FormField label="Password" htmlFor="login-password" error={errors.password?.message} spanFull>
              <div className="password-input-wrap">
                <input
                  id="login-password"
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
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </FormField>

            <FormField spanFull>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-full">
                {isSubmitting ? (
                  <>
                    <span className="spinner spinner--sm" aria-hidden />
                    Logging in…
                  </>
                ) : (
                  'Log In'
                )}
              </button>
            </FormField>
          </FormGrid>
        </form>

        <div className="form-forgot-wrap">
          <button type="button" className="form-forgot-link">
            Forgot password?
          </button>
        </div>

        <p className="form-shell-auth-footer">
          No account?{' '}
          <Link to="/register" className="auth-link">
            Create one
          </Link>
        </p>
      </motion.div>
    </FormLayout>
  );
};

export default LoginPage;
