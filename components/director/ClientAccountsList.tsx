'use client';

import { useState, useMemo } from 'react';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
import { BankAccount } from '@/lib/types-director';
import { Ban, Pause, Play, Edit } from 'lucide-react';
import Link from 'next/link';

interface ClientAccountsListProps {
  accounts: BankAccount[];
  onSuspend: (accountId: string) => Promise<void>;
  onBan: (accountId: string) => Promise<void>;
  onReactivate: (accountId: string) => Promise<void>;
}

export default function ClientAccountsList({
  accounts,
  onSuspend,
  onBan,
  onReactivate,
}: ClientAccountsListProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const typeMatch = filterType === 'all' || account.accountType === filterType;
      const statusMatch = filterStatus === 'all' || account.status === filterStatus;
      return typeMatch && statusMatch;
    });
  }, [accounts, filterType, filterStatus]);

  const handleAction = async (
    accountId: string,
    action: (id: string) => Promise<void>,
    confirmMessage: string
  ) => {
    if (!confirm(confirmMessage)) return;

    setLoadingAccountId(accountId);
    try {
      await action(accountId);
    } finally {
      setLoadingAccountId(null);
    }
  };

  const getStatusBadge = (status: BankAccount['status']) => {
    switch (status) {
      case 'active':
        return <Badge tone="success">Actif</Badge>;
      case 'suspended':
        return <Badge tone="warning">Suspendu</Badge>;
      case 'banned':
        return <Badge tone="warning">Banni</Badge>;
    }
  };

  const getTypeBadge = (type: BankAccount['accountType']) => {
    return type === 'checking' ? (
      <Badge tone="info">Courant</Badge>
    ) : (
      <Badge tone="neutral">Épargne</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="filterType" className="mb-2 block text-sm font-medium text-zinc-300">
              Type de compte
            </label>
            <Select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="checking">Comptes courants</option>
              <option value="savings">Comptes épargne</option>
            </Select>
          </div>

          <div>
            <label htmlFor="filterStatus" className="mb-2 block text-sm font-medium text-zinc-300">
              Statut
            </label>
            <Select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="suspended">Suspendus</option>
              <option value="banned">Bannis</option>
            </Select>
          </div>
        </div>

        <div className="mt-4 text-sm text-zinc-400">
          {filteredAccounts.length} compte{filteredAccounts.length > 1 ? 's' : ''} trouvé
          {filteredAccounts.length > 1 ? 's' : ''}
        </div>
      </Card>

      {filteredAccounts.length === 0 ? (
        <Card className="text-center">
          <div className="py-12">
            <h3 className="mb-2 text-lg font-semibold text-white">Aucun compte trouvé</h3>
            <p className="text-sm text-zinc-400">Aucun compte ne correspond aux filtres sélectionnés</p>
          </div>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Client</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                    N° de compte
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Type</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">Solde</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Statut</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="transition hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{account.clientName}</div>
                      {account.accountType === 'savings' && account.savingsRate && (
                        <div className="text-xs text-zinc-400">
                          Taux: {account.savingsRate.toFixed(2)}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-zinc-300">
                      {account.accountNumber}
                    </td>
                    <td className="px-6 py-4">{getTypeBadge(account.accountType)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-white">
                        {account.balance.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(account.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/director/accounts/${account.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Modifier">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>

                        {account.status === 'active' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAction(
                                  account.id,
                                  onSuspend,
                                  'Êtes-vous sûr de vouloir suspendre ce compte ?'
                                )
                              }
                              disabled={loadingAccountId === account.id}
                              title="Suspendre"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleAction(
                                  account.id,
                                  onBan,
                                  'Êtes-vous sûr de vouloir bannir ce compte ? Cette action est irréversible.'
                                )
                              }
                              disabled={loadingAccountId === account.id}
                              title="Bannir"
                              className="text-[#ff4f70] hover:text-[#ff4f70]"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {(account.status === 'suspended' || account.status === 'banned') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleAction(
                                account.id,
                                onReactivate,
                                'Êtes-vous sûr de vouloir réactiver ce compte ?'
                              )
                            }
                            disabled={loadingAccountId === account.id}
                            title="Réactiver"
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}