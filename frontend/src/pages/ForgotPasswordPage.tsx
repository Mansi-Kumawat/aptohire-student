import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/schemas';
import { Link } from 'react-router-dom';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/brand/Logo';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    setSubmittedEmail(data.email);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center p-4 sm:p-6 lg:p-8 antialiased">
      <Helmet>
        <title>Reset Password · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-full max-w-md mx-auto">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-moss hover:text-ink font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to sign in</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <Logo showPortalBadge={true} />
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Reset your password
          </h1>
          <p className="text-moss text-[15px] mt-1.5">
            We will send you a link to reset your password
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-6 rounded-panel border border-verdant-300 bg-verdant-50/50 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-verdant-700 mx-auto" />
            <h3 className="font-display font-semibold text-lg text-ink">Check your inbox</h3>
            <p className="text-xs text-moss leading-relaxed">
              If an account exists for <strong className="text-ink">{submittedEmail}</strong>, we
              have sent password reset instructions.
            </p>
            <Link to="/login" className="inline-block pt-2">
              <Button variant="secondary" size="sm">
                Return to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label="Email address" htmlFor="email" error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@university.edu"
                error={!!errors.email}
                {...register('email')}
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2">
              Send reset instructions
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
