import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { registerApi } from '../../api/authApi';
import ConfirmDialog from '../../components/ConfirmDialog';
import AuthParticles from '../../components/AuthParticles';
import FormLayout from '../../components/forms/FormLayout';
import FormGrid from '../../components/forms/FormGrid';
import FormField from '../../components/forms/FormField';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
    role: z.enum(['participant', 'judge'], {
      errorMap: () => ({ message: 'Please select a role' }),
    }),
    judgeAccessCode: z.string().optional(),
    phone: z.string().optional(),
    collegeName: z.string().optional(),
    gender: z.string().optional(),
    profilePhoto: z.string().optional(),
  })
  .superRefine((data, ctx) => {
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
  { value: 'judge', label: 'Judge', icon: '⚖️' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const pendingPayload = useRef(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined,
      judgeAccessCode: '',
      phone: '',
      collegeName: '',
      gender: '',
      profilePhoto: '',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = (data) => {
    const { confirmPassword: _confirmPassword, ...payload } = data;
    const allowedGender = new Set(['male', 'female', 'other', 'prefer_not_to_say']);
    if (!payload.gender || !allowedGender.has(payload.gender)) delete payload.gender;
    if (!payload.phone?.trim()) delete payload.phone;
    else payload.phone = payload.phone.trim();
    if (!payload.collegeName?.trim()) delete payload.collegeName;
    else payload.collegeName = payload.collegeName.trim();
    if (!payload.profilePhoto) delete payload.profilePhoto;
    pendingPayload.current = payload;
    setConfirmOpen(true);
  };

  const onPhotoPick = useCallback(
    (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) {
        setServerError('Profile photo must be an image file');
        return;
      }
      const r = new FileReader();
      r.onload = () => {
        setValue('profilePhoto', r.result, { shouldValidate: true });
        setPhotoPreview(r.result);
        setServerError('');
      };
      r.readAsDataURL(f);
      e.target.value = '';
    },
    [setValue]
  );

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
              ? 'Cannot connect to the API. For local dev: start the backend on port 5000, keep VITE_API_URL empty in frontend/.env, then restart Vite.'
              : 'Registration failed')
        );
      }
    } finally {
      setSending(false);
    }
  };

  const leftDecor = (
    <>
      <AuthParticles className="auth-particles-canvas" />
      <div className="form-preview-tags" aria-hidden>
        <span className="form-preview-tag">Hackathon</span>
        <span className="form-preview-tag">Tech</span>
        <span className="form-preview-tag">Culture</span>
        <span className="form-preview-tag">Workshop</span>
      </div>
    </>
  );

  return (
    <FormLayout
      className="form-shell--auth"
      leftTitle="Join Eventify"
      leftSubtitle="Ready to participate? Create your account as a team lead or judge — one calm workspace for every role."
      leftContent={leftDecor}
    >
      <p className="form-section-label">Create account</p>

      {serverError ? <div className="alert alert-danger alert-spacing">{serverError}</div> : null}

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormGrid>
          <FormField label="Full name" htmlFor="reg-name" error={errors.name?.message}>
            <input
              id="reg-name"
              {...register('name')}
              placeholder="Your full name"
              className="form-input"
              autoComplete="name"
            />
          </FormField>

          <FormField label="Email" htmlFor="reg-email" error={errors.email?.message}>
            <input
              id="reg-email"
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="form-input"
              autoComplete="email"
            />
          </FormField>

          <FormField label="Password" htmlFor="reg-pass" error={errors.password?.message}>
            <div className="password-input-wrap">
              <input
                id="reg-pass"
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                className="form-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-emoji"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </FormField>

          <FormField label="Confirm password" htmlFor="reg-pass2" error={errors.confirmPassword?.message}>
            <div className="password-input-wrap">
              <input
                id="reg-pass2"
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                className="form-input"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle-emoji"
                onClick={() => setShowConfirmPassword((p) => !p)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </FormField>

          <FormField spanFull error={errors.role?.message}>
            <span className="form-field-label" id="reg-role-label">
              I am a…
            </span>
            <div className="role-selector" role="group" aria-labelledby="reg-role-label">
              {roleOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`role-option ${selectedRole === opt.value ? 'active' : ''}`}
                  onClick={() => setValue('role', opt.value, { shouldValidate: true })}
                >
                  <input type="radio" className="sr-only" {...register('role')} value={opt.value} />
                  <span className="role-icon">{opt.icon}</span>
                  <span className="role-label">{opt.label}</span>
                </label>
              ))}
            </div>
          </FormField>

          {selectedRole === 'judge' ? (
            <FormField
              label="Judge access code"
              htmlFor="reg-judge"
              error={errors.judgeAccessCode?.message}
              spanFull
            >
              <input
                id="reg-judge"
                {...register('judgeAccessCode')}
                type="password"
                placeholder="Enter secret judge code"
                className="form-input"
                autoComplete="one-time-code"
              />
            </FormField>
          ) : null}

          <FormField label="Profile photo (optional)" htmlFor="reg-photo" spanFull>
            <input id="reg-photo" type="file" accept="image/*" className="form-input" onChange={onPhotoPick} />
            {photoPreview ? (
              <div className="reg-photo-preview">
                <img src={photoPreview} alt="" className="reg-photo-preview__img" />
              </div>
            ) : null}
          </FormField>

          <FormField label="Phone (optional)" htmlFor="reg-phone" error={errors.phone?.message}>
            <input id="reg-phone" {...register('phone')} className="form-input" autoComplete="tel" />
          </FormField>

          <FormField label="College name (optional)" htmlFor="reg-college" error={errors.collegeName?.message}>
            <input id="reg-college" {...register('collegeName')} className="form-input" />
          </FormField>

          <FormField label="Gender (optional)" htmlFor="reg-gender" error={errors.gender?.message}>
            <select id="reg-gender" className="form-input" {...register('gender')}>
              <option value="">Prefer not to specify</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </FormField>

          <FormField spanFull>
            <button type="submit" disabled={isSubmitting || sending} className="btn btn-primary btn-full">
              {isSubmitting || sending ? (
                <>
                  <span className="spinner spinner--sm" aria-hidden />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </FormField>
        </FormGrid>
      </form>

      <p className="form-shell-auth-footer">
        Already have an account?{' '}
        <Link to="/login" className="auth-link">
          Log in
        </Link>
      </p>

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
    </FormLayout>
  );
};

export default RegisterPage;
