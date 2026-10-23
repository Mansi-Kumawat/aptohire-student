import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, ResetPasswordInput } from '@/lib/schemas';
import { useNavigate } from 'react-router-dom';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/brand/Logo';
import { Helmet } from 'react-helmet-async';
import { useBackend } from '@/lib/backend';

export const ResetPasswordPage: React.FC = () => {
  const backend = useBackend();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await backend.auth.updatePassword(data.password);
      navigate('/login?reset=success', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      setServerError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center p-4 sm:p-6 lg:p-8 antialiased">
      <Helmet>
        <title>Set New Password · AptoHire</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block mb-3">
            <Logo showPortalBadge={true} />
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
            Set a new password
          </h1>
          <p className="text-moss text-[15px] mt-1.5">
            Choose a secure password with at least 10 characters
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div className="p-3.5 rounded-control bg-danger-50 text-danger-600 text-sm">
              {serverError}
            </div>
          )}

          <Field label="New password" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 10 characters"
              error={!!errors.password}
              {...register('password')}
            />
          </Field>

          <Field
            label="Confirm new password"
            htmlFor="confirm_password"
            error={errors.confirm_password?.message}
          >
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter password"
              error={!!errors.confirm_password}
              {...register('confirm_password')}
            />
          </Field>

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
            Update password
          </Button>
        </form>
      </div>
    </div>
  );
};
export default ResetPasswordPage;
