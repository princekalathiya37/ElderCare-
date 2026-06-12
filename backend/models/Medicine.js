import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  dosage: String,
  frequency: {
    type: String,
    enum: ['once-daily', 'twice-daily', 'three-times-daily', 'custom'],
    required: true
  },
  scheduledTimes: [String], // Array of times like ["8:00 AM", "8:00 PM"]
  startDate: Date,
  endDate: Date,
  smsAlert: {
    type: Boolean,
    default: true
  },
  smsContact: String, // Phone number of caregiver
  pushNotification: {
    type: Boolean,
    default: true
  },
  escalationMinutes: {
    type: Number,
    default: 30 // Notify caregiver after 30 minutes
  },
  confirmations: [{
    date: Date,
    time: String,
    confirmed: Boolean,
    confirmedAt: Date,
    smsAlertSent: Boolean,
    smsAlertSentAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Medicine', medicineSchema);
