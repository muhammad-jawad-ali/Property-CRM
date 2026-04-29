import mongoose, { Schema, models } from 'mongoose';

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['admin', 'agent'],
    default: 'agent',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default models.User || mongoose.model('User', UserSchema);