import mongoose, { Schema, models } from 'mongoose';

const ActivityLogSchema = new Schema({
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  oldValue: {
    type: String,
    default: '',
  },
  newValue: {
    type: String,
    default: '',
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);