import { Schema, model, Document } from 'mongoose';
import { UserRole } from '@domain/entities/User';

export interface IUserDocument extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CLIENT,
    required: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
    required: true
  },
  emailVerificationToken: {
    type: String,
    sparse: true,
    index: true
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ emailVerificationToken: 1 });
UserSchema.index({ role: 1 });

export const UserModel = model<IUserDocument>('User', UserSchema);
