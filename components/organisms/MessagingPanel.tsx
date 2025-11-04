'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import SectionTitle from '@/components/atoms/SectionTitle';
import { useClientData } from '@/contexts/ClientDataContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTime } from '@/lib/format';

const messageSchema = z.object({
  content: z.string().min(1, 'form.error.required'),
});

type MessageFormValues = z.infer<typeof messageSchema>;

export default function MessagingPanel() {
  const { state, appendMessage, setAdvisorTyping } = useClientData();
  const { t, language } = useI18n();

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' },
  });

  useEffect(() => {
    // Simulate advisor typing on mount
    setAdvisorTyping(true);
    const timeout = setTimeout(() => setAdvisorTyping(false), 4000);
    return () => {
      clearTimeout(timeout);
      setAdvisorTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const submitMessage = form.handleSubmit((values: MessageFormValues) => {
    appendMessage({ author: 'client', content: values.content });
    form.reset();
    setAdvisorTyping(true);
    setTimeout(() => setAdvisorTyping(false), 2500);
  });

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title={t('messages.title')} subtitle={t('messages.subtitle')} />
      <Card>
        <div className="flex max-h-96 flex-col gap-4 overflow-y-auto pr-2">
          {state.messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.author === 'client' ? 'items-end text-right' : 'items-start text-left'}`}
            >
              <div
                className={`max-w-sm rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  message.author === 'client'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-900'
                }`}
              >
                <p>{message.content}</p>
              </div>
              <span className="mt-1 text-xs text-zinc-400">
                {formatDateTime(message.createdAt, language)}
              </span>
            </div>
          ))}
          {state.advisorTyping ? (
            <p className="text-xs italic text-emerald-600">
              {t('messages.status.writing', { author: state.advisorName })}
            </p>
          ) : null}
        </div>
        <form onSubmit={submitMessage} className="mt-4 flex gap-3">
          <Input
            placeholder={t('messages.placeholder')}
            {...form.register('content')}
            hasError={Boolean(form.formState.errors.content)}
          />
          <Button type="submit">{t('messages.send')}</Button>
        </form>
        {form.formState.errors.content ? (
          <p className="mt-2 text-xs text-red-500">
            {t('form.error.required')}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
