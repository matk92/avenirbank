'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import FormField from '@/components/molecules/FormField';
import LanguageSwitcher from '@/components/atoms/LanguageSwitcher';
import ThemeToggle from '@/components/atoms/ThemeToggle';
import Beams from '@/components/Beams';
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
    <div className="relative min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Beams
          beamWidth={3}
          beamHeight={24}
          beamNumber={10}
          lightColor="#c0c0c0"
          speed={1.35}
          noiseIntensity={1.4}
          scale={0.3}
          rotation={-12}
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-linear-to-b from-[#1f1f1f]/80 via-[#2a2a2a]/50 to-black/70" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
        <section className="w-full rounded-4xl border border-white/15 bg-black/55 p-8 backdrop-blur-3xl">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Avenir</p>
              <h2 className="text-2xl font-semibold">{t('auth.loginTitle')}</h2>
              <p className="text-sm text-white/60">{t('home.heroSubtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-5">
            <FormField label={t('auth.email.label')} htmlFor="login-email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder={t('auth.email.placeholder')}
                  className="pl-12"
                  {...form.register('email')}
                  hasError={Boolean(form.formState.errors.email)}
                />
              </div>
              {form.formState.errors.email ? (
                <p className="text-xs text-[#ff4f70]">
                  {t((form.formState.errors.email.message as TranslationKey | undefined) ?? 'form.error.email')}
                </p>
              ) : null}
            </FormField>

            <FormField label={t('auth.password.label')} htmlFor="login-password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder={t('auth.password.placeholder')}
                  className="pl-12"
                  {...form.register('password')}
                  hasError={Boolean(form.formState.errors.password)}
                />
              </div>
              {form.formState.errors.password ? (
                <p className="text-xs text-[#ff4f70]">
                  {t((form.formState.errors.password.message as TranslationKey | undefined) ?? 'form.error.required')}
                </p>
              ) : null}
            </FormField>

            <div className="flex items-center justify-between text-sm text-white/60">
              <span>{t('auth.switchToLogin')}</span>
              <Link href="/auth/forgot-password" className="text-white transition hover:text-[#a855f7]">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button type="submit" className="mt-2 w-full gap-2">
              {t('auth.login.cta')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {success ? (
            <div className="mt-5 rounded-2xl border border-[#40f3c0]/30 bg-[#40f3c0]/10 p-3 text-center text-sm text-[#40f3c0]">
              {success}
            </div>
          ) : null}

          <p className="mt-8 text-center text-sm text-white/60">
            {t('auth.switchToRegister')}{' '}
            <Link href="/auth/register" className="font-semibold text-white transition hover:text-[#a855f7]">
              {t('auth.registerTitle')}
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
