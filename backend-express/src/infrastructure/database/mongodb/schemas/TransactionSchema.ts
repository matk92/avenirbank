import { Schema, model, Document } from 'mongoose';
import { TransactionType } from '@domain/entities/Transaction';

export interface ITransactionDocument extends Document {
  fromAccountId?: string;
  toAccountId: string;
  amount: number;
  type: TransactionType;
  description: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>({
  fromAccountId: {
    type: String,
    required: false,
    index: true
  },
  toAccountId: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'transactions'
});

// Indexes for performance
TransactionSchema.index({ fromAccountId: 1 });
TransactionSchema.index({ toAccountId: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ createdAt: -1 });
TransactionSchema.index({ fromAccountId: 1, createdAt: -1 });
TransactionSchema.index({ toAccountId: 1, createdAt: -1 });

export const TransactionModel = model<ITransactionDocument>('Transaction', TransactionSchema);
