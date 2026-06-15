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
    enum: ['once-daily', 'twice-daily', 'three-times-daily', 'four-times-daily', 'as-needed', 'weekly', 'monthly', 'custom'],
    required: true
  },
  scheduledTimes: [String], // Array of times like ["08:00", "20:00"]
  startDate: Date,
  endDate: Date,
  emailAlert: {
    type: Boolean,
    default: true
  },
  emailContact: String, // Email of caregiver/emergency contact to alert if not taken
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
    emailAlertSent: Boolean,
    emailAlertSentAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Medicine', medicineSchema);
