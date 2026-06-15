import EmergencySOS from '../models/EmergencySOS.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendEmergencySosNotification } from '../services/notificationService.js';

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

    // Extract coordinates — handles both flat {lat, lng} and nested {location: {lat, lng}}
    const locObj = (location && typeof location.lat !== 'undefined') ? location
      : (location && location.location) ? location.location
      : location;
    const lat = locObj?.lat ?? locObj?.latitude ?? null;
    const lng = locObj?.lng ?? locObj?.longitude ?? null;
    const addressStr = lat && lng ? `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Unknown Location';
    const mapLink = lat && lng ? ` Maps: https://www.google.com/maps?q=${lat},${lng}` : '';

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
        channel: 'email'
      });

      // Create notification record
      await Notification.create({
        userId: req.userId,
        type: 'emergency-sos',
        title: 'Emergency SOS Activated',
        message: `${user.name} has activated emergency SOS at ${addressStr}`,
        status: 'sent',
        channel: 'email',
        recipientEmail: contact.email,
        metadata: sosData
      });
    }

    await sos.save();

    res.status(201).json({
      success: true,
      message: 'Emergency SOS triggered successfully',
      sos,
      notifiedContacts: user.emergencyContacts.length,
      smsDeliveryStatus: sosData.deliveryResults
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
      if (contact.email) {
        const { sendEmailNotification } = await import('../services/notificationService.js');
        const subject = `✅ SOS Resolved: ${user.name} is safe`;
        const text = `${user.name}'s emergency SOS has been resolved and they are safe. No further action needed.`;
        const html = `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; border: 2px solid #10b981; border-radius: 8px; overflow: hidden;"><div style="background-color: #10b981; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">✅ Emergency Alert Resolved</div><div style="padding: 24px; color: #1f2937;"><h2 style="color: #059669;">${user.name} is safe</h2><p>The emergency SOS alert has been resolved. ${user.name} is safe and no further action is needed.</p><div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">This message was sent by ElderCare+ Emergency Alert System.</div></div></div>`;
        await sendEmailNotification(contact.email, subject, text, html);
      }
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
