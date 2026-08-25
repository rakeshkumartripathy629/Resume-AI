import { model, Schema } from 'mongoose';

export interface ICoinTransaction {
  userId: string;
  action: string;
  amount: number;
  balanceAfter: number;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const coinTransactionSchema = new Schema<ICoinTransaction>(
  {
    userId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CoinTransaction = model<ICoinTransaction>('CoinTransaction', coinTransactionSchema);
