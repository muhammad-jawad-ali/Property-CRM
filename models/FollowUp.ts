import mongoose, { Schema, models } from 'mongoose';

const FollowUpSchema = new Schema({
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  agentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  followUpDate: {
    type: Date,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default models.FollowUp || mongoose.model('FollowUp', FollowUpSchema);