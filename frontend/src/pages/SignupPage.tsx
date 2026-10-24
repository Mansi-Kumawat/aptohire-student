import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, SignupInput } from '@/lib/schemas';
import { useAuth } from '@/features/auth/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { rootUrl } from '@/config/links';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Mail, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
    },
  });

  const passwordVal = watch('password') || '';
  const hasLength = passwordVal.length >= 10;
  const hasUppercase = /[A-Z]/.test(passwordVal);
  const hasNumber = /[0-9]/.test(passwordVal);

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    setServerError(null);
    try {
      const res = await signUp(data);
      if (res.requiresEmailVerification) {
        setRegisteredEmail(data.email);
        setVerificationRequired(true);
      } else {
        // Direct onboarding
        navigate('/onboarding', { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationRequired) {
    return (
      <div
        className="min-h-screen flex flex-col justify-center items-center p-6 text-center antialiased relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #eaf8f0 0%, #f6fbf8 30%, #ffffff 52%, #fdf8f0 78%, #fef3e5 100%)',
        }}
      >
        <Helmet>
          <title>Check Your Email · AptoHire</title>
        </Helmet>
        <div className="relative rounded-3xl bg-white/92 backdrop-blur-xl border border-verdant-100/80 shadow-[0_20px_50px_-12px_rgba(11,127,73,0.08)] p-8 max-w-[488px] w-full flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 mb-6 border border-emerald-300 shadow-sm">
            <Mail className="w-8 h-8 stroke-[1.75]" />
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-2">
            Check your email
          </h1>
          <p className="text-moss text-[15px] max-w-sm mb-6 leading-relaxed">
            We sent a verification link to <strong className="text-ink">{registeredEmail}</strong>.
            Click the link to activate your student profile.
          </p>
          <Link to="/login" className="w-full">
            <Button
              variant="primary"
              size="lg"
              className="w-full rounded-xl bg-gradient-to-r from-[#0b7f49] via-[#0b824a] to-[#08673a] hover:from-[#0a7241] text-white shadow-md shadow-emerald-700/20"
            >
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased selection:bg-verdant-100 selection:text-verdant-900 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #eaf8f0 0%, #f6fbf8 30%, #ffffff 52%, #fdf8f0 78%, #fef3e5 100%)',
      }}
    >
      <Helmet>
        <title>Create Student Account · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Ambient luminous glow accents */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-60 -z-10"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-60 -z-10"
        style={{
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-1/3 -right-20 w-80 h-80 rounded-full pointer-events-none blur-3xl opacity-40 -z-10"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, transparent 70%)',
        }}
      />

      {/* Top Bar with Back Link */}
      <div className="w-full max-w-[488px] mx-auto flex items-center justify-between pt-2 relative z-10">
        <a
          href={rootUrl('/')}
          className="inline-flex items-center gap-1.5 text-xs text-moss hover:text-ink font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to aptohire.com</span>
        </a>
        <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200 shadow-2xs">
          Student Portal
        </span>
      </div>

      {/* Central Auth Area with Modern Gradient Card */}
      <div className="w-full max-w-[488px] mx-auto my-auto py-6 relative z-10">
        <div className="relative rounded-3xl bg-white/92 backdrop-blur-xl border border-verdant-100/80 shadow-[0_20px_50px_-12px_rgba(11,127,73,0.08),0_1px_3px_rgba(0,0,0,0.04)] p-6 sm:p-8 space-y-6 overflow-hidden">
          {/* Top decorative gradient hairline */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{
              background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #f59e0b 100%)',
            }}
          />

          {/* Brand Logo matching Logo.jpeg */}
          <div className="text-center space-y-3 pt-1">
            <Link to="/" aria-label="AptoHire Home" className="inline-block">
              <img
                src="/aptohire-logo-transparent.png"
                alt="AptoHire"
                className="h-10 w-auto mx-auto object-contain select-none"
              />
            </Link>

            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
                Create your student account
              </h1>
              <p className="text-moss text-[14.5px] mt-1 font-normal">
                Your permanent cryptographic skill credential starts here
              </p>
            </div>
          </div>

          {/* Segmented Pill Switcher (Sign in vs Create account) */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/70 w-full shadow-inner">
            <Link
              to="/login"
              className="flex-1 py-2 text-center rounded-xl text-sm font-medium text-moss hover:text-ink transition-colors"
            >
              Sign in
            </Link>
            <button
              type="button"
              className="flex-1 py-2 text-center rounded-xl text-sm font-semibold bg-white text-ink shadow-sm transition-all"
            >
              Create account
            </button>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverError && (
              <div
                className="p-3.5 rounded-xl bg-danger-50 border border-danger-600/30 text-danger-600 text-sm"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
              <Input
                id="full_name"
                placeholder="Aarav Sharma"
                className="h-11 rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white border-hairline focus:border-verdant-600 focus:ring-2 focus:ring-verdant-500/20 text-sm shadow-2xs transition-all"
                error={!!errors.full_name}
                {...register('full_name')}
              />
            </Field>

            <Field
              label="University or personal email"
              htmlFor="email"
              helperText="University email automatically matches your roster if registered."
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                placeholder="you@university.edu"
                className="h-11 rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white border-hairline focus:border-verdant-600 focus:ring-2 focus:ring-verdant-500/20 text-sm shadow-2xs transition-all"
                error={!!errors.email}
                {...register('email')}
              />
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
            >
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  className="h-11 pr-10 rounded-xl bg-slate-50/50 hover:bg-white focus:bg-white border-hairline focus:border-verdant-600 focus:ring-2 focus:ring-verdant-500/20 text-sm shadow-2xs transition-all"
                  error={!!errors.password}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-moss hover:text-ink focus:outline-none transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Real-time Password Requirements */}
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs space-y-1.5">
                <div
                  className={`flex items-center gap-1.5 ${
                    hasLength ? 'text-emerald-700 font-medium' : 'text-moss'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      hasLength ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span>At least 10 characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasUppercase ? 'text-emerald-700 font-medium' : 'text-moss'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      hasUppercase ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span>One uppercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${
                    hasNumber ? 'text-emerald-700 font-medium' : 'text-moss'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      hasNumber ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span>One number</span>
                </div>
              </div>
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 h-11 rounded-xl font-semibold bg-gradient-to-r from-[#0b7f49] via-[#0b824a] to-[#08673a] hover:from-[#0a7241] hover:to-[#075631] text-white shadow-md shadow-emerald-700/20 active:scale-[0.99] transition-all"
              isLoading={isLoading}
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 ml-1.5 inline" />
            </Button>
          </form>

          <div className="text-center pt-1 text-xs text-moss">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-verdant-800 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Sleek Minimalist Footer */}
      <footer className="w-full max-w-[488px] mx-auto text-center text-xs text-moss pb-2 relative z-10">
        <p>AptoHire · Cryptographic Proof-of-Skill Platform</p>
      </footer>
    </div>
  );
};

export default SignupPage;
