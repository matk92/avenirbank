import { Schema, model, Document } from 'mongoose';
import { AccountType } from '@domain/entities/Account';

export interface IAccountDocument extends Document {
  userId: string;
  name: string;
  iban: string;
  balance: number;
  type: AccountType;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccountDocument>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  iban: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  type: {
    type: String,
    enum: Object.values(AccountType),
    required: true
  }
}, {
  timestamps: true,
  collection: 'accounts'
});

// Indexes for performance
AccountSchema.index({ userId: 1 });
AccountSchema.index({ iban: 1 });
AccountSchema.index({ type: 1 });
AccountSchema.index({ userId: 1, type: 1 });

export const AccountModel = model<IAccountDocument>('Account', AccountSchema);
