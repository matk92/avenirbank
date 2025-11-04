'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LogIn, Mail, Lock } from 'lucide-react';
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

const loginSchema = z.object({
  email: z.string().email('form.error.email'),
  password: z.string().min(1, 'form.error.required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useI18n();
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = form.handleSubmit((values: LoginFormValues) => {
    console.info('login', values);
    setSuccess(t('form.success.generic'));
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-zinc-50 to-white px-4 py-16 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200/50">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('auth.loginTitle')}</h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Avenir Bank</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        <Card>
          <form onSubmit={submit} className="flex flex-col gap-5">
            <FormField label={t('auth.email.label')} htmlFor="login-email">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t('auth.email.placeholder')}
                  className="pl-10"
                  {...form.register('email')}
                  hasError={Boolean(form.formState.errors.email)}
                />
              </div>
              {form.formState.errors.email ? (
                <p className="text-xs text-red-500">
                  {t((form.formState.errors.email.message as TranslationKey | undefined) ?? 'form.error.email')}
                </p>
              ) : null}
            </FormField>

            <FormField label={t('auth.password.label')} htmlFor="login-password">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder={t('auth.password.placeholder')}
                  className="pl-10"
                  {...form.register('password')}
                  hasError={Boolean(form.formState.errors.password)}
                />
              </div>
              {form.formState.errors.password ? (
                <p className="text-xs text-red-500">
                  {t((form.formState.errors.password.message as TranslationKey | undefined) ?? 'form.error.required')}
                </p>
              ) : null}
            </FormField>

            <Button type="submit" className="w-full">
              <LogIn className="h-4 w-4" />
              {t('auth.login.cta')}
            </Button>
          </form>
          {success ? (
            <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {success}
            </div>
          ) : null}
        </Card>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          {t('auth.switchToRegister')}{" "}
          <Link href="/auth/register" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
            {t('auth.registerTitle')}
          </Link>
        </p>
      </div>
    </div>
  );
}
