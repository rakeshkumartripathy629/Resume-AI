import mongoose, { Schema, model, Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL: string;
  provider: string;
  coins: number;
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, default: '' },
    photoURL: { type: String, default: '' },
    provider: { type: String, default: 'firebase' },
    coins: { type: Number, default: 50, min: 0 },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
