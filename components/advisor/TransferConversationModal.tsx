'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
import Modal from '@/components/molecules/Modal';
import { ClientProfile } from '@/lib/types-advisor';

interface TransferConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (toAdvisorId: string, toAdvisorName: string, reason: string) => void;
  currentAdvisorId: string;
}

export default function TransferConversationModal({
  isOpen,
  onClose,
  onTransfer,
  currentAdvisorId,
}: TransferConversationModalProps) {
  const [advisors, setAdvisors] = useState<ClientProfile[]>([]);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAdvisors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/advisor/list', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAdvisors(data.filter((advisor: ClientProfile) => advisor.id !== currentAdvisorId));
        }
      } catch (error) {
        console.error('Error fetching advisors:', error);
      }
    };

    fetchAdvisors();
  }, [isOpen, currentAdvisorId]);

  const handleSubmit = async () => {
    if (!selectedAdvisorId || !reason.trim()) {
      setError('Veuillez sélectionner un conseiller et indiquer la raison du transfert');
      return;
    }

    const selectedAdvisor = advisors.find((a) => a.id === selectedAdvisorId);
    if (!selectedAdvisor) return;

    setIsLoading(true);
    setError(null);

    try {
      onTransfer(
        selectedAdvisorId,
        `${selectedAdvisor.firstName} ${selectedAdvisor.lastName}`,
        reason
      );
      handleClose();
    } catch (err) {
      setError('Une erreur est survenue lors du transfert');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedAdvisorId('');
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Transférer la conversation">
      <div className="space-y-4">
        <p className="text-sm text-zinc-300">
          Transférez cette conversation à un autre conseiller. Le client sera notifié du changement.
        </p>
        <div>
          <label htmlFor="advisor" className="mb-2 block text-sm font-medium text-zinc-300">
            Conseiller destinataire
          </label>
          <Select
            id="advisor"
            value={selectedAdvisorId}
            onChange={(e) => setSelectedAdvisorId(e.target.value)}
          >
            <option value="">Sélectionnez un conseiller</option>
            {advisors.map((advisor) => (
              <option key={advisor.id} value={advisor.id}>
                {advisor.firstName} {advisor.lastName} ({advisor.email})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="reason" className="mb-2 block text-sm font-medium text-zinc-300">
            Raison du transfert
          </label>
          <textarea
            id="reason"
            rows={4}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 shadow-[0_10px_30px_rgba(5,1,13,0.65)] transition focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            placeholder="Expliquez la raison du transfert..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Cette information sera partagée avec le conseiller destinataire
          </p>
        </div>
        {error && (
          <div className="rounded-xl border border-[#ff4f70]/30 bg-[#ff4f70]/10 p-3 text-sm text-[#ff4f70]">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1" disabled={isLoading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="flex-1"
            disabled={isLoading || !selectedAdvisorId || !reason.trim()}
          >
            {isLoading ? 'Transfert...' : 'Transférer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}