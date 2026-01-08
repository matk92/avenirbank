export class Money {
  private constructor(private readonly amount: number) {}

  public static create(amount: number): Money {
    if (!Money.isValid(amount)) {
      throw new Error('Invalid money amount');
    }
    return new Money(Money.roundToTwoDecimals(amount));
  }

  public static zero(): Money {
    return new Money(0);
  }

  public static isValid(amount: number): boolean {
    return typeof amount === 'number' && 
           !isNaN(amount) && 
           isFinite(amount) && 
           amount >= 0 &&
           Money.hasMaxTwoDecimals(amount);
  }

  private static hasMaxTwoDecimals(amount: number): boolean {
    return Number((amount * 100).toFixed(0)) === amount * 100;
  }

  private static roundToTwoDecimals(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  public getAmount(): number {
    return this.amount;
  }

  public add(other: Money): Money {
    return new Money(Money.roundToTwoDecimals(this.amount + other.amount));
  }

  public subtract(other: Money): Money {
    const result = Money.roundToTwoDecimals(this.amount - other.amount);
    if (result < 0) {
      throw new Error('Cannot subtract more money than available');
    }
    return new Money(result);
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Cannot multiply money by negative factor');
    }
    return new Money(Money.roundToTwoDecimals(this.amount * factor));
  }

  public isGreaterThan(other: Money): boolean {
    return this.amount > other.amount;
  }

  public isGreaterThanOrEqual(other: Money): boolean {
    return this.amount >= other.amount;
  }

  public isLessThan(other: Money): boolean {
    return this.amount < other.amount;
  }

  public isEqual(other: Money): boolean {
    return this.amount === other.amount;
  }

  public toString(): string {
    return `€${this.amount.toFixed(2)}`;
  }

  public toNumber(): number {
    return this.amount;
  }
}
