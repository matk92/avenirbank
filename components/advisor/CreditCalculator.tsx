'use client';

import { useMemo } from 'react';
import Card from '@/components/atoms/Card';
import { CreditCalculation } from '@/lib/types-advisor';

interface CreditCalculatorProps {
  amount: number;
  annualInterestRate: number;
  insuranceRate: number;
  durationMonths: number;
}

export default function CreditCalculator({
  amount,
  annualInterestRate,
  insuranceRate,
  durationMonths,
}: CreditCalculatorProps) {
  const calculation = useMemo((): CreditCalculation | null => {
    if (amount <= 0 || durationMonths <= 0) return null;

    // Taux mensuel
    // le taux annuel est divisé par 12 et converti en décimal

    const monthlyRate = annualInterestRate / 100 / 12;

    // Calcul de la mensualité (formule de mensualité constante)
    // M = C * (t/12) / (1 - (1 + t/12)^(-n))
    // M = mensualité
    // C = capital emprunté 
    // t = taux annuel en décimal
    // n = durée en mois
    const monthlyPayment =
      monthlyRate === 0
        ? amount / durationMonths
        : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -durationMonths));

    const totalInsurance = (amount * insuranceRate) / 100;
    const monthlyInsurance = totalInsurance / durationMonths;

    const amortizationSchedule: CreditCalculation['amortizationSchedule'] = [];
    let remainingBalance = amount;

    for (let month = 1; month <= durationMonths; month++) {
      const interest = remainingBalance * monthlyRate;
      const principal = monthlyPayment - interest;
      remainingBalance -= principal;

      if (remainingBalance < 0.01) remainingBalance = 0;

      amortizationSchedule.push({
        month,
        principal,
        interest,
        insurance: monthlyInsurance,
        remainingBalance,
      });
    }

    const totalInterest = monthlyPayment * durationMonths - amount;
    const totalAmount = amount + totalInterest + totalInsurance;

    return {
      monthlyPayment,
      monthlyInsurance,
      totalAmount,
      totalInterest,
      totalInsurance,
      amortizationSchedule,
    };
  }, [amount, annualInterestRate, insuranceRate, durationMonths]);

  if (!calculation) {
    return (
      <Card className="text-center">
        <p className="text-sm text-zinc-400">
          Entrez les informations du crédit pour voir le calcul
        </p>
      </Card>
    );
  }

  const totalMonthly = calculation.monthlyPayment + calculation.monthlyInsurance;

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 text-xl font-bold text-white">Résumé du crédit</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-400">Mensualité (hors assurance)</span>
            <span className="font-semibold text-white">
              {calculation.monthlyPayment.toFixed(2)} €
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Assurance mensuelle</span>
            <span className="font-semibold text-white">
              {calculation.monthlyInsurance.toFixed(2)} €
            </span>
          </div>
          <div className="border-t border-white/10 pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-white">Mensualité totale</span>
              <span className="text-2xl font-bold text-emerald-400">{totalMonthly.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <h3 className="mb-4 text-xl font-bold text-white">Coût total</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-400">Capital emprunté</span>
            <span className="font-semibold text-white">{amount.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Intérêts totaux</span>
            <span className="font-semibold text-white">{calculation.totalInterest.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Assurance totale</span>
            <span className="font-semibold text-white">{calculation.totalInsurance.toFixed(2)} €</span>
          </div>
          <div className="border-t border-white/10 pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-white">Total à rembourser</span>
              <span className="text-2xl font-bold text-emerald-400">
                {calculation.totalAmount.toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </Card>
      <Card>
        <h3 className="mb-4 text-xl font-bold text-white">Tableau d'amortissement</h3>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur">
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-left font-semibold text-white">Mois</th>
                <th className="px-3 py-2 text-right font-semibold text-white">Capital</th>
                <th className="px-3 py-2 text-right font-semibold text-white">Intérêts</th>
                <th className="px-3 py-2 text-right font-semibold text-white">Assurance</th>
                <th className="px-3 py-2 text-right font-semibold text-white">Restant dû</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {calculation.amortizationSchedule.map((row) => (
                <tr key={row.month} className="hover:bg-white/5">
                  <td className="px-3 py-2 text-zinc-300">{row.month}</td>
                  <td className="px-3 py-2 text-right text-white">{row.principal.toFixed(2)} €</td>
                  <td className="px-3 py-2 text-right text-zinc-400">{row.interest.toFixed(2)} €</td>
                  <td className="px-3 py-2 text-right text-zinc-400">{row.insurance.toFixed(2)} €</td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-400">
                    {row.remainingBalance.toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}