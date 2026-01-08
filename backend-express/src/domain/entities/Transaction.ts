export enum TransactionType {
  TRANSFER = 'TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  INTEREST = 'INTEREST'
}

export interface TransactionProps {
  id: string;
  fromAccountId?: string;
  toAccountId: string;
  amount: number;
  type: TransactionType;
  description: string;
  createdAt: Date;
}

export class Transaction {
  private constructor(private readonly props: TransactionProps) {}

  public static create(props: Omit<TransactionProps, 'id' | 'createdAt'>): Transaction {
    return new Transaction({
      ...props,
      id: '', // Will be set by repository
      createdAt: new Date()
    });
  }

  public static fromPersistence(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  public getId(): string {
    return this.props.id;
  }

  public getFromAccountId(): string | undefined {
    return this.props.fromAccountId;
  }

  public getToAccountId(): string {
    return this.props.toAccountId;
  }

  public getAmount(): number {
    return this.props.amount;
  }

  public getType(): TransactionType {
    return this.props.type;
  }

  public getDescription(): string {
    return this.props.description;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public isTransfer(): boolean {
    return this.props.type === TransactionType.TRANSFER && this.props.fromAccountId !== undefined;
  }

  public toPlainObject(): TransactionProps {
    return { ...this.props };
  }
}
