import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine'
  },
  type: {
    type: String,
    enum: ['medicine-reminder', 'escalation', 'emergency-sos', 'appointment'],
    required: true
  },
  title: String,
  message: String,
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen', 'failed'],
    default: 'sent'
  },
  channel: {
    type: String,
    enum: ['push', 'sms', 'email'],
    required: true
  },
  recipientPhone: String,
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: Date,
  seenAt: Date,
  metadata: mongoose.Schema.Types.Mixed // Additional data like medicine details
});

export default mongoose.model('Notification', notificationSchema);
