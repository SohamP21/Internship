import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '../../api/authApi';
import useAuthStore from '../../store/authStore';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role:     z.enum(['coordinator', 'participant', 'judge']),
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

 const onSubmit = async (data) => {
  setServerError('');
  try {
    await registerApi(data);
    navigate('/login');
  } catch (err) {
    setServerError(err.response?.data?.message || 'Registration failed');
  }
};

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 1rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Eventify</h1>
      <h2 style={{ textAlign: 'center', fontWeight: 400, marginBottom: 32 }}>Create account</h2>

      
      {serverError && (
        <p style={{ color: 'red', textAlign: 'center', marginBottom: 16 }}>{serverError}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label>Name</label>
          <input {...register('name')} placeholder="Your full name" style={inputStyle} />
          {errors.name && <span style={errStyle}>{errors.name.message}</span>}
        </div>

        <div>
          <label>Email</label>
          <input {...register('email')} type="email" placeholder="you@example.com" style={inputStyle} />
          {errors.email && <span style={errStyle}>{errors.email.message}</span>}
        </div>

        <div>
          <label>Password</label>
          <input {...register('password')} type="password" placeholder="Min 6 characters" style={inputStyle} />
          {errors.password && <span style={errStyle}>{errors.password.message}</span>}
        </div>

        <div>
          <label>I am a...</label>
          <select {...register('role')} style={inputStyle}>
            <option value="">Select role</option>
            <option value="participant">Participant (Team Lead)</option>
            <option value="judge">Judge</option>
            <option value="coordinator">Club Coordinator</option>
          </select>
          {errors.role && <span style={errStyle}>{errors.role.message}</span>}
        </div>

        <button type="submit" disabled={isSubmitting} style={btnStyle}>
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16 }}>
        Already have an account? <Link to="/login">Log in</Link>
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

export default RegisterPage;