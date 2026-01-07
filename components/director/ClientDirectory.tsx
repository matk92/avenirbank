'use client';

import { useState } from 'react';
import Card from '@/components/atoms/Card';
import Input from '@/components/atoms/Input';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { DirectorClient } from '@/lib/types-director';
import { Search, User, Edit, Ban, Trash2 } from 'lucide-react';

interface ClientDirectoryProps {
  clients: DirectorClient[];
  onRefresh: () => Promise<void>;
}

export default function ClientDirectory({ clients, onRefresh }: ClientDirectoryProps) {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<DirectorClient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredClients = search.trim().length === 0
    ? clients
    : clients.filter((c) =>
        `${c.firstName} ${c.lastName} ${c.email}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      );

  const handleSelectClient = (client: DirectorClient) => {
    setSelectedClient(client);
    setIsEditing(false);
    setFirstName(client.firstName);
    setLastName(client.lastName);
    setEmail(client.email);
    setPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleEdit = async () => {
    if (!selectedClient) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload: Record<string, unknown> = { firstName, lastName, email };
      if (password.trim().length > 0) payload.password = password;

      const response = await fetch(`/api/director/clients/${selectedClient.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.message || err?.error || 'Erreur');
      }

      setSuccess('Client modifié');
      await onRefresh();
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    if (!selectedClient) return;
    const willBan = !selectedClient.isBanned;
    if (!confirm(willBan ? 'Bannir ce client ?' : 'Débannir ce client ?')) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/director/clients/${selectedClient.id}/${willBan ? 'ban' : 'unban'}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.message || err?.error || 'Erreur');
      }

      setSuccess(willBan ? 'Client banni' : 'Client débanni');
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    if (!confirm('Supprimer ce client ? (uniquement si aucun compte)')) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/director/clients/${selectedClient.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status !== 204) {
        const err = await response.json();
        throw new Error(err?.message || err?.error || 'Erreur');
      }

      setSuccess('Client supprimé');
      setSelectedClient(null);
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  console.log('ClientDirectory - clients:', clients.length);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 text-xl font-bold text-white">Annuaire clients ({clients.length})</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="pl-10"
          />
        </div>

        <div className="max-h-[500px] space-y-2 overflow-y-auto">
          {filteredClients.length === 0 ? (
            <div className="py-8 text-center text-zinc-400">
              {clients.length === 0 
                ? 'Aucun client enregistré. Créez un client pour commencer.' 
                : 'Aucun client ne correspond à votre recherche'}
            </div>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
                className={`w-full rounded-xl p-3 text-left transition ${
                  selectedClient?.id === client.id
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'hover:bg-white/5 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/10 p-2">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">
                        {client.firstName} {client.lastName}
                      </p>
                      {client.isBanned && <Badge tone="warning">Banni</Badge>}
                      {!client.isEmailConfirmed && <Badge tone="neutral">Non vérifié</Badge>}
                    </div>
                    <p className="text-xs text-zinc-400">{client.email}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card>
        {!selectedClient ? (
          <div className="py-16 text-center">
            <User className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
            <p className="text-zinc-400">Sélectionnez un client dans l&apos;annuaire</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedClient.firstName} {selectedClient.lastName}
                </h2>
                <p className="text-sm text-zinc-400">{selectedClient.email}</p>
              </div>
              <div className="flex gap-2">
                {selectedClient.isBanned ? (
                  <Badge tone="warning">Banni</Badge>
                ) : (
                  <Badge tone="success">Actif</Badge>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">
                      Prénom
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-300">Nom</label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dupont"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean@example.com"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Nouveau mot de passe (optionnel)
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleEdit} disabled={loading}>
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleBan}
                    disabled={loading}
                    className="text-[#ff4f70] hover:text-[#ff4f70]"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {selectedClient.isBanned ? 'Débannir' : 'Bannir'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleDelete}
                    disabled={loading}
                    className="text-[#ff4f70] hover:text-[#ff4f70]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-[#ff4f70]/30 bg-[#ff4f70]/10 p-3 text-sm text-[#ff4f70]">
                {error}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}