import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    default: ''
  },
  phone: String,
  age: Number,
  bloodGroup: String,
  specialization: String,
  medicalConditions: [String],
  allergies: [String],
  role: {
    type: String,
    enum: ['elder'],
    default: 'elder'
  },
  googleId: String,
  fcmToken: String,
  pushSubscription: mongoose.Schema.Types.Mixed,
  emergencyContacts: [{
    name: String,
    phone: String,
    email: String,
    relationship: String
  }],

  notificationPreferences: {
    medicineReminders: { type: Boolean, default: true },
    appointmentReminders: { type: Boolean, default: true },
    sosAlerts: { type: Boolean, default: true },
    dailyHealthSummary: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema);
