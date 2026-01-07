'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import { X } from 'lucide-react';

const clientSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function CreateClientModal({ isOpen, onClose, onSuccess }: CreateClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const handleFormSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/director/clients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.message || err?.error || 'Erreur lors de la création');
      }

      reset();
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Créer un client</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-zinc-300">
                Prénom
              </label>
              <Input
                id="firstName"
                placeholder="Jean"
                hasError={!!errors.firstName}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-[#ff4f70]">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-zinc-300">
                Nom
              </label>
              <Input
                id="lastName"
                placeholder="Dupont"
                hasError={!!errors.lastName}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-[#ff4f70]">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="jean.dupont@example.com"
              hasError={!!errors.email}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-[#ff4f70]">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
              Mot de passe
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 caractères"
              hasError={!!errors.password}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-[#ff4f70]">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-[#ff4f70]/30 bg-[#ff4f70]/10 p-3 text-sm text-[#ff4f70]">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-[0_15px_35px_rgba(245,158,11,0.35)]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création...' : 'Créer le client'}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}