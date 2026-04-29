import mongoose, { Schema, models } from 'mongoose';

const LeadSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required (for WhatsApp)'],
  },
  propertyInterest: {
    type: String,
    required: true,
  },
  budget: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'In Progress', 'Closed'],
    default: 'New',
  },
  notes: {
    type: String,
    default: '',
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',          // References the User model
    default: null,
  },
  score: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Low',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// MIDDLEWARE: Auto-calculate score based on budget BEFORE saving
LeadSchema.pre('save', function(next:any) {
  if (this.isModified('budget')) {
    if (this.budget > 20000000) {
      this.score = 'High';
    } else if (this.budget >= 10000000) {
      this.score = 'Medium';
    } else {
      this.score = 'Low';
    }
  }
  next();
});

export default models.Lead || mongoose.model('Lead', LeadSchema);