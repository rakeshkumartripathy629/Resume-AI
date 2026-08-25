import { model, Schema } from 'mongoose';

export interface IPayment {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  planId: string;
  amountInPaise: number;
  currency: string;
  coinAmount: number;
  status: 'created' | 'paid' | 'failed';
  coinsCredited: boolean;
  createdAt: Date;
  paidAt?: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: { type: String, required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    planId: { type: String, required: true },
    amountInPaise: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    coinAmount: { type: Number, required: true },
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
    coinsCredited: { type: Boolean, default: false },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.set('toJSON', {
  transform(_doc, ret) {
    const plain = ret as unknown as Record<string, unknown>;
    plain.id = (ret._id as { toString(): string }).toString();
    delete plain._id;
    delete plain.__v;
    return plain;
  },
});

export const Payment = model<IPayment>('Payment', paymentSchema);
