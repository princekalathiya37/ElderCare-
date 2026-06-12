import mongoose from 'mongoose';

const emergencySosSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'cancelled'],
    default: 'active'
  },
  notifiedContacts: [{
    contactId: mongoose.Schema.Types.ObjectId,
    name: String,
    phone: String,
    email: String,
    notifiedAt: Date,
    channel: String // 'sms', 'push', 'email'
  }],
  callInitiated: Boolean,
  callNumber: String,
  emergencyDetails: {
    userLocation: String,
    userMedicalInfo: String,
    timestamp: Date
  },
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('EmergencySOS', emergencySosSchema);
