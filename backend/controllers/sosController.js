import EmergencySOS from '../models/EmergencySOS.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendEmergencySosNotification, sendPushNotification, sendSMSNotification } from '../services/notificationService.js';

// ============ TRIGGER EMERGENCY SOS ============
export const triggerEmergencySOS = async (req, res) => {
  try {
    const { location } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Form address string fallback using coordinates if address is missing
    const addressStr = location.address || (location.latitude && location.longitude ? `GPS: ${location.latitude}, ${location.longitude}` : location.lat && location.lng ? `GPS: ${location.lat}, ${location.lng}` : 'Unknown Location');
    const conditionsStr = Array.isArray(user.medicalConditions) ? user.medicalConditions.join(', ') : 'None';
    const medicalInfoStr = `Age: ${user.age || 'Not set'}, Blood: ${user.bloodGroup || 'Not set'}, Conditions: ${conditionsStr}`;

    // Create SOS record
    const sos = new EmergencySOS({
      userId: req.userId,
      location,
      status: 'active',
      emergencyDetails: {
        userLocation: addressStr,
        userMedicalInfo: medicalInfoStr,
        timestamp: new Date()
      }
    });

    // Send notifications to emergency contacts
    const sosData = await sendEmergencySosNotification(user, location);

    // Track notifications sent
    for (const contact of user.emergencyContacts) {
      sos.notifiedContacts.push({
        contactId: contact._id,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        notifiedAt: new Date(),
        channel: 'sms'
      });

      // Create notification record
      await Notification.create({
        userId: req.userId,
        type: 'emergency-sos',
        title: 'Emergency SOS Activated',
        message: `${user.name} has activated emergency SOS at ${addressStr}`,
        status: 'sent',
        channel: 'sms',
        recipientPhone: contact.phone,
        metadata: sosData
      });
    }

    await sos.save();

    res.status(201).json({
      success: true,
      message: 'Emergency SOS triggered successfully',
      sos,
      notifiedContacts: user.emergencyContacts.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ GET ACTIVE SOS ============
export const getActiveSOS = async (req, res) => {
  try {
    const activeSOS = await EmergencySOS.find({
      userId: req.userId,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: activeSOS
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ RESOLVE SOS ============
export const resolveSOS = async (req, res) => {
  try {
    const sos = await EmergencySOS.findOneAndUpdate(
      {
        _id: req.params.sosId,
        userId: req.userId
      },
      {
        status: 'resolved',
        resolvedAt: new Date()
      },
      { new: true }
    );

    if (!sos) {
      return res.status(404).json({ error: 'SOS record not found' });
    }

    // Notify emergency contacts that SOS is resolved
    const user = await User.findById(req.userId);
    for (const contact of user.emergencyContacts) {
      const message = `✅ Alert resolved: ${user.name}'s emergency SOS has been handled. Status updated.`;
      await sendSMSNotification(contact.phone, message);
    }

    res.json({
      success: true,
      message: 'SOS resolved and contacts notified',
      sos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ GET SOS HISTORY ============
export const getSOSHistory = async (req, res) => {
  try {
    const sosHistory = await EmergencySOS.find({
      userId: req.userId
    }).sort({ createdAt: -1 }).limit(50);

    const stats = {
      totalSOS: sosHistory.length,
      activeCount: sosHistory.filter(s => s.status === 'active').length,
      resolvedCount: sosHistory.filter(s => s.status === 'resolved').length,
      cancelledCount: sosHistory.filter(s => s.status === 'cancelled').length
    };

    res.json({
      success: true,
      stats,
      data: sosHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  triggerEmergencySOS,
  getActiveSOS,
  resolveSOS,
  getSOSHistory
};
