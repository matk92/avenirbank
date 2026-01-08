export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS'
}

export interface AccountProps {
  id: string;
  userId: string;
  name: string;
  iban: string;
  balance: number;
  type: AccountType;
  createdAt: Date;
  updatedAt: Date;
}

export class Account {
  private constructor(private readonly props: AccountProps) {}

  public static create(props: Omit<AccountProps, 'id' | 'createdAt' | 'updatedAt'>): Account {
    const now = new Date();
    return new Account({
      ...props,
      id: '', // Will be set by repository
      createdAt: now,
      updatedAt: now
    });
  }

  public static fromPersistence(props: AccountProps): Account {
    return new Account(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getUserId(): string {
    return this.props.userId;
  }

  public getName(): string {
    return this.props.name;
  }

  public getIban(): string {
    return this.props.iban;
  }

  public getBalance(): number {
    return this.props.balance;
  }

  public getType(): AccountType {
    return this.props.type;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  public updateName(newName: string): void {
    this.props.name = newName;
    this.props.updatedAt = new Date();
  }

  public debit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive');
    }
    if (this.props.balance < amount) {
      throw new Error('Insufficient funds');
    }
    this.props.balance -= amount;
    this.props.updatedAt = new Date();
  }

  public credit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }
    this.props.balance += amount;
    this.props.updatedAt = new Date();
  }

  public hasSufficientFunds(amount: number): boolean {
    return this.props.balance >= amount;
  }

  public toPlainObject(): AccountProps {
    return { ...this.props };
  }
}
