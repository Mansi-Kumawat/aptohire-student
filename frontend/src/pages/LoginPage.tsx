import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/schemas';
import { useAuth } from '@/features/auth/useAuth';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/brand/Logo';
import { DemoAccountsPanel } from '@/features/auth/DemoAccountsPanel';
import { rootUrl } from '@/config/links';
import { env } from '@/config/env';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export const LoginPage: React.FC = () => {
  const { user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
    <div className="min-h-screen bg-canvas flex flex-col justify-between p-4 sm:p-6 lg:p-8 antialiased">
      <Helmet>
        <title>Sign In · AptoHire Student</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Top bar with back to marketing root site */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pt-2">
        <a
          href={rootUrl('/')}
          className="inline-flex items-center gap-1.5 text-xs text-moss hover:text-ink font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to aptohire.com</span>
        </a>
      </div>

      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <Logo showPortalBadge={true} />
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Sign in to your account
          </h1>
          <p className="text-moss text-[15px] mt-1.5">
            Prove what you can do through real projects
          </p>
        </div>

        {/* Active Session / Cookies Detected */}
        {user && (
          <div className="p-4 rounded-panel bg-verdant-50 border border-verdant-200 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-verdant-600 animate-pulse" />
                <p className="text-xs font-semibold uppercase tracking-wider text-verdant-800">
                  Active Session & Cookies Active
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-verdant-100 text-verdant-800">
                {user.role}
              </span>
            </div>
            <p className="text-sm font-medium text-ink">
              Signed in as <strong>{user.full_name || user.email}</strong>
            </p>
            <div className="flex items-center gap-2 pt-1 border-t border-verdant-200/60">
              <Link to={redirectTo || '/'} className="flex-1">
                <Button variant="primary" size="sm" className="w-full">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div
              className="p-3.5 rounded-control bg-danger-50 border border-danger-600/30 text-danger-600 text-sm"
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
              error={!!errors.email}
              {...register('email')}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••"
              error={!!errors.password}
              {...register('password')}
            />
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
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Sign in
          </Button>

          <p className="text-center text-sm text-moss pt-2">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-verdant-700 hover:text-verdant-800 underline underline-offset-2"
            >
              Sign up
            </Link>
          </p>
        </form>

        <DemoAccountsPanel
          onSelectAccount={handleSelectDemoAccount}
          isLoading={isLoading}
        />
      </div>

      <div className="w-full max-w-md mx-auto text-center text-xs text-moss pb-2">
        <p>AptoHire · Verified skill credentials</p>
      </div>
    </div>
  );
};
export default LoginPage;
