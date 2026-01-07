"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDirectorData } from "@/contexts/DirectorDataContext";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";

export default function EditAccountPage() {
  const router = useRouter();
  const { accountId } = useParams() as { accountId: string };
  const { accounts, deleteAccount } = useDirectorData();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const account = accounts.find((a) => a.id === accountId);

  const handleDelete = async () => {
    if (!account) return;
    if (!confirm(`Supprimer le compte ${account.accountNumber} ?`)) return;
    
    setError(null);
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/director/accounts/${account.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.status === 204) {
        deleteAccount(account.id);
        router.push("/director/accounts");
        return;
      }
      
      const data = await response.json();
      throw new Error(data?.message || data?.error || "Erreur lors de la suppression");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!account) {
    return (
      <div className="p-8">
        <p className="text-zinc-400">Compte introuvable</p>
        <Link href="/director/accounts" className="mt-4 inline-block text-emerald-400 hover:underline">
          Retour aux comptes
        </Link>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (account.status) {
      case 'active':
        return <Badge tone="success">Actif</Badge>;
      case 'suspended':
        return <Badge tone="warning">Suspendu</Badge>;
      case 'banned':
        return <Badge tone="warning">Banni</Badge>;
    }
  };

  const getTypeBadge = () => {
    return account.accountType === 'checking' ? (
      <Badge tone="info">Courant</Badge>
    ) : (
      <Badge tone="neutral">Épargne</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Link
        href="/director/accounts"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux comptes
      </Link>

      <div>
        <h1 className="mb-2 text-4xl font-bold text-white">Détails du compte</h1>
        <p className="text-zinc-400">Compte de {account.clientName}</p>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-zinc-400">Client</p>
              <p className="text-lg font-semibold text-white">{account.clientName}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Numéro de compte</p>
              <p className="font-mono text-lg font-semibold text-white">{account.accountNumber}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-zinc-400">Type</p>
              <div className="mt-1">{getTypeBadge()}</div>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Statut</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Solde</p>
              <p className="text-lg font-semibold text-white">
                {account.balance.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </p>
            </div>
          </div>

          {account.accountType === 'savings' && account.savingsRate && (
            <div>
              <p className="text-sm text-zinc-400">Taux d&apos;épargne</p>
              <p className="text-lg font-semibold text-white">{account.savingsRate.toFixed(2)}%</p>
            </div>
          )}

          <div>
            <p className="text-sm text-zinc-400">Créé le</p>
            <p className="text-white">
              {new Date(account.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-bold text-white">Actions dangereuses</h2>
        <p className="mb-4 text-sm text-zinc-400">
          La suppression d&apos;un compte est irréversible. Le compte doit avoir un solde de 0€.
        </p>
        <Button
          variant="ghost"
          onClick={handleDelete}
          disabled={isDeleting || account.balance !== 0}
          className="text-[#ff4f70] hover:bg-[#ff4f70]/10 disabled:opacity-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "Suppression..." : "Supprimer ce compte"}
        </Button>
        {account.balance !== 0 && (
          <p className="mt-2 text-xs text-zinc-500">
            Le solde doit être à 0€ pour supprimer ce compte
          </p>
        )}
      </Card>

      {error && (
        <Card className="border-[#ff4f70]/30 bg-[#ff4f70]/10">
          <p className="text-sm text-[#ff4f70]">{error}</p>
        </Card>
      )}
    </div>
  );
}