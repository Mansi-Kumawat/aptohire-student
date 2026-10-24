import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/schemas';
import { Link } from 'react-router-dom';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, CheckCircle2, Mail, ArrowRight } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    // Simulate brief network delay for authentic interactive feedback
    await new Promise((r) => setTimeout(r, 400));
    setSubmittedEmail(data.email);
    setIsSubmitted(true);
    setIsLoading(false);
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
        <title>Reset Password · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Ambient luminous glow accents matching login and signup */}
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
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-moss hover:text-ink font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </Link>
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
                Reset your password
              </h1>
              <p className="text-moss text-[14.5px] mt-1 font-normal">
                {isSubmitted
                  ? 'Password reset instructions have been dispatched'
                  : "Enter your registered email and we'll send reset instructions"}
              </p>
            </div>
          </div>

          {isSubmitted ? (
            <div className="space-y-5">
              <div className="p-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/80 to-teal-50/40 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mx-auto border border-emerald-200 shadow-xs">
                  <CheckCircle2 className="w-7 h-7 stroke-[1.75]" />
                </div>
                <h3 className="font-display font-semibold text-lg text-ink">
                  Check your inbox
                </h3>
                <p className="text-xs text-moss leading-relaxed">
                  If an account exists for <strong className="text-ink">{submittedEmail}</strong>,
                  we have sent instructions to reset your password.
                </p>
              </div>

              <div className="space-y-3">
                <Link to="/login" className="block w-full">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-11 rounded-xl font-semibold bg-gradient-to-r from-[#0b7f49] via-[#0b824a] to-[#08673a] hover:from-[#0a7241] text-white shadow-md shadow-emerald-700/20"
                  >
                    Return to sign in
                  </Button>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="w-full py-2 text-center text-xs text-moss hover:text-ink font-medium transition-colors"
                >
                  Didn't receive an email? <span className="text-verdant-800 underline">Try another email</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Field
                label="Registered email address"
                htmlFor="email"
                error={errors.email?.message}
                helperText="Enter the email associated with your AptoHire student account"
              >
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-moss pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@university.edu"
                    className="pl-10 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                    error={!!errors.email}
                    {...register('email')}
                  />
                </div>
              </Field>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 h-11 rounded-xl font-semibold bg-gradient-to-r from-[#0b7f49] via-[#0b824a] to-[#08673a] hover:from-[#0a7241] hover:to-[#075631] text-white shadow-md shadow-emerald-700/20 active:scale-[0.99] transition-all"
                isLoading={isLoading}
              >
                <span>Send reset instructions</span>
                <ArrowRight className="w-4 h-4 ml-1.5 inline" />
              </Button>

              <div className="text-center pt-2 text-xs text-moss">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="text-verdant-800 font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Sleek Minimalist Footer */}
      <footer className="w-full max-w-[488px] mx-auto text-center text-xs text-moss pb-2 relative z-10">
        <p>AptoHire · Cryptographic Proof-of-Skill Platform</p>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
