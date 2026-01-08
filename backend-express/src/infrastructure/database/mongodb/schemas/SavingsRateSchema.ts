import { Schema, model } from 'mongoose';

export interface ISavingsRate {
  _id: string;
  rate: number;
  effectiveDate: Date;
  setBy: string;
  createdAt: Date;
}

const savingsRateSchema = new Schema<ISavingsRate>({
  _id: { type: String, required: true },
  rate: { type: Number, required: true, min: 0, max: 100 },
  effectiveDate: { type: Date, required: true },
  setBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const SavingsRateModel = model<ISavingsRate>('SavingsRate', savingsRateSchema);
