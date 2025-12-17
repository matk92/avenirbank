'use client';

import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import FormField from '@/components/molecules/FormField';
import LanguageSwitcher from '@/components/atoms/LanguageSwitcher';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import { useI18n } from '@/contexts/I18nContext';
import type { TranslationKey } from '@/lib/i18n';

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'form.error.required'),
    lastName: z.string().min(1, 'form.error.required'),
    email: z.string().email('form.error.email'),
    password: z.string().min(6, 'form.error.required'),
    confirmPassword: z.string().min(6, 'form.error.required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'form.error.passwordMismatch',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { t } = useI18n();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const submit = form.handleSubmit(async (values: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      await response.json();
      setSuccess(t('form.success.generic'));
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-zinc-50 to-white px-4 py-16 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{t('auth.registerTitle')}</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
        <Card>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <FormField label={t('auth.firstName.label')} htmlFor="register-firstName">
              <Input
                id="register-firstName"
                placeholder={t('auth.firstName.placeholder')}
                {...form.register('firstName')}
                hasError={Boolean(form.formState.errors.firstName)}
                disabled={isLoading}
              />
              {form.formState.errors.firstName ? (
                <p className="text-xs text-red-500">
                  {t((form.formState.errors.firstName.message as TranslationKey | undefined) ?? 'form.error.required')}
                </p>
              ) : null}
            </FormField>
            <FormField label={t('auth.lastName.label')} htmlFor="register-lastName">
              <Input
                id="register-lastName"
                placeholder={t('auth.lastName.placeholder')}
                {...form.register('lastName')}
                hasError={Boolean(form.formState.errors.lastName)}
                disabled={isLoading}
              />
              {form.formState.errors.lastName ? (
                <p className="text-xs text-red-500">
                  {t((form.formState.errors.lastName.message as TranslationKey | undefined) ?? 'form.error.required')}
                </p>
              ) : null}
            </FormField>
            <FormField label={t('auth.email.label')} htmlFor="register-email">
              <Input
                id="register-email"
                type="email"
                placeholder={t('auth.email.placeholder')}
                {...form.register('email')}
                hasError={Boolean(form.formState.errors.email)}
                disabled={isLoading}
              />
              {form.formState.errors.email ? (
                <p className="text-xs text-red-500">
                  {t((form.formState.errors.email.message as TranslationKey | undefined) ?? 'form.error.email')}
                </p>
              ) : null}
            </FormField>
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <FormField label={t('auth.password.label')} htmlFor="register-password">
                <Input
                  id="register-password"
                  type="password"
                  placeholder={t('auth.password.placeholder')}
                  {...form.register('password')}
                  hasError={Boolean(form.formState.errors.password)}
                  disabled={isLoading}
                />
                {form.formState.errors.password ? (
                  <p className="text-xs text-red-500">
                    {t((form.formState.errors.password.message as TranslationKey | undefined) ?? 'form.error.required')}
                  </p>
                ) : null}
              </FormField>
              <FormField label={t('auth.confirmPassword.label')} htmlFor="register-confirm-password">
                <Input
                  id="register-confirm-password"
                  type="password"
                  placeholder={t('auth.password.placeholder')}
                  {...form.register('confirmPassword')}
                  hasError={Boolean(form.formState.errors.confirmPassword)}
                  disabled={isLoading}
                />
                {form.formState.errors.confirmPassword ? (
                  <p className="text-xs text-red-500">
                    {t(
                      (form.formState.errors.confirmPassword.message as TranslationKey | undefined) ??
                        'form.error.passwordMismatch',
                    )}
                  </p>
                ) : null}
              </FormField>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Loading...' : t('auth.register.cta')}
              </Button>
            </div>
          </form>
          {success ? (
            <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {success}
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          ) : null}
        </Card>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t('auth.switchToLogin')}{" "}
          <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
            {t('auth.loginTitle')}
          </Link>
        </p>
      </div>
    </div>
  );
}
