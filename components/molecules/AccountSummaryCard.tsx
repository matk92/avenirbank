import type { ReactNode } from 'react';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';

export type AccountSummaryCardProps = {
  name: string;
  iban: string;
  balance: string;
  statusLabel: string;
  statusTone?: 'success' | 'warning' | 'neutral';
  actions?: ReactNode;
};

export default function AccountSummaryCard({ name, iban, balance, statusLabel, statusTone = 'success', actions }: AccountSummaryCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <p className="text-sm text-white/50">IBAN {iban}</p>
        </div>
        <Badge tone={statusTone}>{statusLabel}</Badge>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-white/60">Solde</p>
          <p className="text-2xl font-semibold text-white">{balance}</p>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </Card>
  );
}
