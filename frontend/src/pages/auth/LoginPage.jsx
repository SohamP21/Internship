import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginApi } from '../../api/authApi';
import useAuthStore from '../../store/authStore';

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
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const res = await loginApi(data);
      const { token, user } = res.data.data;
      setAuth({ token, user });
      navigate(dashboardMap[user.role]);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 1rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Eventify</h1>
      <h2 style={{ textAlign: 'center', fontWeight: 400, marginBottom: 32 }}>Welcome back</h2>

      {serverError && (
        <p style={{ color: 'red', textAlign: 'center', marginBottom: 16 }}>{serverError}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label>Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com" style={inputStyle} />
          {errors.email && <span style={errStyle}>{errors.email.message}</span>}
        </div>

        <div>
          <label>Password</label>
          <input {...register('password')} type="password" placeholder="Your password" style={inputStyle} />
          {errors.password && <span style={errStyle}>{errors.password.message}</span>}
        </div>

        <button type="submit" disabled={isSubmitting} style={btnStyle}>
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16 }}>
        No account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
};

const inputStyle = {
  display: 'block', width: '100%', padding: '10px 12px',
  marginTop: 4, border: '1px solid #ccc', borderRadius: 6,
  fontSize: 14, boxSizing: 'border-box',
};
const errStyle = { color: 'red', fontSize: 12, marginTop: 4, display: 'block' };
const btnStyle = {
  padding: '12px', background: '#4F46E5', color: '#fff',
  border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer',
};

export default LoginPage;