export function projectSavingsBalance(balance: number, dailyRate: number, days: number) {
  if (days <= 0 || balance <= 0 || dailyRate <= 0) {
    return { projectedBalance: balance, accruedInterest: 0, days }; 
  }
  const projectedBalance = balance * Math.pow(1 + dailyRate, days);
  return {
    projectedBalance,
    accruedInterest: projectedBalance - balance,
    days,
  };
}

export function accrueSavingsBalance(balance: number, dailyRate: number, lastCapitalization: string, now = new Date()) {
  const lastDate = new Date(lastCapitalization);
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.floor((now.getTime() - lastDate.getTime()) / msPerDay);
  const { projectedBalance, accruedInterest } = projectSavingsBalance(balance, dailyRate, days);
  return {
    balance: projectedBalance,
    interestEarned: accruedInterest,
    daysAccrued: days,
    newCapitalizationDate: now.toISOString(),
  };
}

export function calculateOrderTotal(quantity: number, limitPrice: number, flatFee = 1) {
  const notional = quantity * limitPrice;
  const total = notional + flatFee;
  return { notional, fees: flatFee, total };
}

export function calculateLoanMonthlyPayment(principal: number, annualRate: number, termMonths: number, insuranceAnnualRate: number) {
  const monthlyRate = annualRate / 12;
  const insuranceMonthly = (principal * insuranceAnnualRate) / 12;
  if (monthlyRate === 0) {
    const base = termMonths === 0 ? 0 : principal / termMonths;
    return { monthlyPayment: base + insuranceMonthly, principalAndInterest: base, insuranceMonthly };
  }
  const factor = Math.pow(1 + monthlyRate, termMonths);
  const principalAndInterest = principal * (monthlyRate * factor) / (factor - 1);
  const monthlyPayment = principalAndInterest + insuranceMonthly;
  return { monthlyPayment, principalAndInterest, insuranceMonthly };
}
