import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/schemas';
import { useAuth } from '@/features/auth/useAuth';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DemoAccountsPanel } from '@/features/auth/DemoAccountsPanel';
import { rootUrl } from '@/config/links';
import { env } from '@/config/env';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export const LoginPage: React.FC = () => {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await signIn(data);
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid login credentials.';
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoAccount = async (email: string) => {
    setValue('email', email);
    setValue('password', env.VITE_DEMO_PASSWORD || 'demo-password');
    setIsLoading(true);
    setServerError(null);
    try {
      await signIn({
        email,
        password: env.VITE_DEMO_PASSWORD || 'demo-password',
      });
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo sign in failed.';
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased selection:bg-verdant-100 selection:text-verdant-900 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, #eaf8f0 0%, #f6fbf8 30%, #ffffff 52%, #fdf8f0 78%, #fef3e5 100%)',
      }}
    >
      <Helmet>
        <title>Sign In · AptoHire Student</title>
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
                Sign in to your account
              </h1>
              <p className="text-moss text-[14.5px] mt-1 font-normal">
                Prove what you can do through real projects
              </p>
            </div>
          </div>

          {/* Segmented Pill Switcher (Sign in vs Create account) */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100/90 border border-slate-200/70 w-full shadow-inner">
            <button
              type="button"
              className="flex-1 py-2 text-center rounded-xl text-sm font-semibold bg-white text-ink shadow-sm transition-all"
            >
              Sign in
            </button>
            <Link
              to="/signup"
              className="flex-1 py-2 text-center rounded-xl text-sm font-medium text-moss hover:text-ink transition-colors"
            >
              Create account
            </Link>
          </div>

          {/* Active Session & Cookies Alert if already logged in */}
          {user && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border border-emerald-200/90 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900">
                    Active Session & Cookies Active
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium">
                  {user.role}
                </span>
              </div>
              <p className="text-sm font-medium text-ink">
                Signed in as <strong>{user.full_name || user.email}</strong>
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/60">
                <Link to={redirectTo || '/'} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full rounded-xl">
                    Continue to dashboard →
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-xs text-moss hover:text-ink"
                >
                  Sign out
                </Button>
              </div>
            </div>
          )}

          {/* Clean Sign In Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverError && (
              <div
                className="p-3.5 rounded-xl bg-danger-50 border border-danger-600/30 text-danger-600 text-sm"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <Field label="University or personal email" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
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
                  autoComplete="current-password"
                  placeholder="••••••••••"
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
            </Field>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-moss hover:text-ink select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-hairline text-verdant-700 focus:ring-verdant-700/20"
                />
                <span>Remember me (keep cookies active)</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-moss hover:text-ink font-medium underline underline-offset-2 shrink-0"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 h-11 rounded-xl font-semibold bg-gradient-to-r from-[#0b7f49] via-[#0b824a] to-[#08673a] hover:from-[#0a7241] hover:to-[#075631] text-white shadow-md shadow-emerald-700/20 active:scale-[0.99] transition-all"
              isLoading={isLoading}
            >
              Sign in
            </Button>
          </form>

          {/* Demo Accounts Panel */}
          <div className="pt-1">
            <DemoAccountsPanel
              onSelectAccount={handleSelectDemoAccount}
              isLoading={isLoading}
            />
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

export default LoginPage;
