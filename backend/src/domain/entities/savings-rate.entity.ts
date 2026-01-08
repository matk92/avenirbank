export class SavingsRate {
  id: string;
  rate: number;
  effectiveDate: Date;
  setBy: string;
  createdAt: Date;

  constructor(
    id: string,
    rate: number,
    effectiveDate: Date,
    setBy: string,
  ) {
    this.id = id;
    this.rate = rate;
    this.effectiveDate = effectiveDate;
    this.setBy = setBy;
    this.createdAt = new Date();

    this.validate();
  }

  private validate(): void {
    if (this.rate < 0) {
      throw new Error('Savings rate cannot be negative');
    }
    if (this.rate > 100) {
      throw new Error('Savings rate cannot exceed 100%');
    }
  }

  calculateDailyInterest(balance: number): number {
    return (balance * this.rate) / 365 / 100;
  }

  isActive(): boolean {
    return this.effectiveDate <= new Date();
  }
}
