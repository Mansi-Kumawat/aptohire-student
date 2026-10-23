import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, SignupInput } from '@/lib/schemas';
import { useAuth } from '@/features/auth/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/brand/Logo';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Mail, ArrowRight } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

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
      <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-6 text-center antialiased">
        <Helmet>
          <title>Check Your Email · AptoHire</title>
        </Helmet>
        <div className="w-16 h-16 rounded-full bg-verdant-100 flex items-center justify-center text-verdant-800 mb-6 border border-verdant-300">
          <Mail className="w-8 h-8 stroke-[1.75]" />
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-2">
          Check your email
        </h1>
        <p className="text-moss text-[15px] max-w-md mb-6 leading-relaxed">
          We sent a verification link to <strong className="text-ink">{registeredEmail}</strong>.
          Click the link to activate your student profile.
        </p>
        <Link to="/login">
          <Button variant="secondary" size="lg">
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center p-4 sm:p-6 lg:p-8 antialiased">
      <Helmet>
        <title>Create Student Account · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-full max-w-md mx-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <Logo showPortalBadge={true} />
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Create your account
          </h1>
          <p className="text-moss text-[15px] mt-1.5">
            Your permanent skill credential starts here
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div
              className="p-3.5 rounded-control bg-danger-50 border border-danger-600/30 text-danger-600 text-sm"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
            <Input
              id="full_name"
              placeholder="Aarav Sharma"
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
              autoComplete="new-password"
              placeholder="At least 10 characters"
              error={!!errors.password}
              {...register('password')}
            />

            {/* Clear password strength indicator */}
            <div className="mt-2 text-xs space-y-1 text-moss">
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${hasLength ? 'text-verdant-700' : 'text-moss/40'}`}
                />
                <span>At least 10 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${hasUppercase ? 'text-verdant-700' : 'text-moss/40'}`}
                />
                <span>One uppercase letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${hasNumber ? 'text-verdant-700' : 'text-moss/40'}`}
                />
                <span>One number</span>
              </div>
            </div>
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-center text-sm text-moss pt-2">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-verdant-700 hover:text-verdant-800 underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
export default SignupPage;
