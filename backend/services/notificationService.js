import admin from 'firebase-admin';
import twilio from 'twilio';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK (Optional - works without it for dev)
let firebaseInitialized = false;
try {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  };

  // Only initialize if all credentials are provided
  if (firebaseConfig.projectId && firebaseConfig.privateKey && firebaseConfig.clientEmail) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig)
      });
      firebaseInitialized = true;
      console.log('✓ Firebase initialized');
    }
  } else {
    console.log('⚠️  Firebase credentials not found - running in mock mode');
  }
} catch (err) {
  console.log('⚠️  Firebase initialization failed - running in mock mode');
  console.log('   Error:', err.message);
}

// Initialize Twilio (Optional - runs in mock mode if missing)
let twilioClient = null;
let twilioInitialized = false;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    twilioInitialized = true;
    console.log('✓ Twilio initialized');
  } else {
    console.log('⚠️  Twilio credentials not found - running in mock mode');
  }
} catch (err) {
  console.log('⚠️  Twilio initialization failed - running in mock mode');
  console.log('   Error:', err.message);
}

// ============ PUSH NOTIFICATION SERVICE ============
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    if (!fcmToken) {
      console.log('No FCM token available');
      return null;
    }

    const message = {
      notification: {
        title,
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      },
      data,
      token: fcmToken,
      webpush: {
        fcmOptions: {
          link: '/'
        },
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'notification',
          requireInteraction: true
        }
      }
    };

    // Send via Firebase only if initialized
    if (firebaseInitialized) {
      const response = await admin.messaging().send(message);
      console.log('✓ Push notification sent:', response);
      return response;
    } else {
      console.log('ℹ️  Push notification (mock mode):', title);
      return { messageId: 'mock-' + Date.now() };
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Don't throw - continue running without Firebase
    return { error: error.message, mock: true };
  }
};

// ============ SMS NOTIFICATION SERVICE ============
export const sendSMSNotification = async (phoneNumber, message) => {
  try {
    if (!phoneNumber) {
      console.log('No phone number provided for SMS');
      return null;
    }

    if (twilioInitialized && twilioClient) {
      const response = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('SMS sent:', response.sid);
      return response;
    } else {
      console.log('ℹ️  SMS (mock mode) to', phoneNumber, ':', message);
      return { sid: 'mock-sms-' + Date.now() };
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { error: error.message, mock: true };
  }
};

// ============ MEDICINE REMINDER NOTIFICATION ============
export const sendMedicineReminder = async (user, medicine, time) => {
  const reminderData = {
    type: 'medicine-reminder',
    medicineId: medicine._id.toString(),
    medicineName: medicine.name,
    dosage: medicine.dosage,
    time
  };

  const title = '💊 Medicine Reminder';
  const body = `Time to take ${medicine.name} (${medicine.dosage})`;

  // Send push notification
  if (medicine.pushNotification && user.fcmToken) {
    await sendPushNotification(user.fcmToken, title, body, reminderData);
  }

  // Send SMS if enabled
  if (medicine.smsAlert && medicine.smsContact) {
    const smsMessage = `ElderCare+: Reminder to take ${medicine.name} (${medicine.dosage}) at ${time}. Please confirm in the app.`;
    await sendSMSNotification(medicine.smsContact, smsMessage);
  }
};

// ============ ESCALATION NOTIFICATION (30 MIN) ============
export const sendEscalationNotification = async (user, medicine, time) => {
  // Notify caregiver via SMS and push
  const escalationMessage = `⚠️ ALERT: ${user.name} has not confirmed taking ${medicine.name} (${medicine.dosage}) at ${time}. Please check on them.`;

  // Send SMS to caregiver
  if (medicine.smsContact) {
    await sendSMSNotification(medicine.smsContact, escalationMessage);
  }

  // Send push to caregiver if they have FCM token stored
  // You'd need to fetch the caregiver user document
  const notificationData = {
    type: 'escalation',
    elderName: user.name,
    medicineName: medicine.name,
    time
  };

  return {
    type: 'escalation',
    message: escalationMessage,
    timestamp: new Date()
  };
};

// ============ EMERGENCY SOS NOTIFICATION ============
export const sendEmergencySosNotification = async (user, location) => {
  const addressStr = location.address || (location.latitude && location.longitude ? `GPS: ${location.latitude}, ${location.longitude}` : location.lat && location.lng ? `GPS: ${location.lat}, ${location.lng}` : 'Unknown Location');
  const lat = location.latitude || location.lat;
  const lng = location.longitude || location.lng;
  const mapLink = (lat && lng) ? ` Maps: https://www.google.com/maps?q=${lat},${lng}` : '';
  const conditionsStr = Array.isArray(user.medicalConditions) ? user.medicalConditions.join(', ') : 'None';
  const allergiesStr = Array.isArray(user.allergies) ? user.allergies.join(', ') : 'None';

  const sosData = {
    type: 'emergency-sos',
    userId: user._id.toString(),
    userName: user.name,
    userAge: user.age,
    location: { ...location, address: addressStr },
    bloodGroup: user.bloodGroup,
    medicalConditions: user.medicalConditions || [],
    allergies: user.allergies || []
  };

  const title = '🚨 EMERGENCY SOS ALERT';
  const body = `${user.name} has activated emergency SOS at ${addressStr}`;

  // Notify all emergency contacts
  for (const contact of user.emergencyContacts) {
    try {
      // Send SMS
      const smsMessage = `🚨 EMERGENCY: ${user.name} (Age: ${user.age || 'Not set'}, Blood: ${user.bloodGroup || 'Not set'}) has activated SOS at ${addressStr}.${mapLink} Medical Conditions: ${conditionsStr}. Allergies: ${allergiesStr}`;
      await sendSMSNotification(contact.phone, smsMessage);

      // Send email if available
      if (contact.email) {
        // Email sending would be implemented here
        console.log(`Email would be sent to ${contact.email}`);
      }
    } catch (error) {
      console.error(`Error notifying contact ${contact.name}:`, error);
    }
  }

  return sosData;
};

// ============ BROWSER PUSH API (Web Push) ============
export const sendWebPushNotification = async (pushSubscription, title, body, data = {}) => {
  try {
    if (!pushSubscription) {
      console.log('No push subscription available');
      return null;
    }

    // This would integrate with web-push library
    // For now, we're using Firebase which handles it
    const notification = {
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.type || 'notification',
      requireInteraction: data.type === 'emergency-sos',
      data
    };

    // In production, use web-push library:
    // const webpush = require('web-push');
    // await webpush.sendNotification(pushSubscription, JSON.stringify(notification));

    console.log('Web push notification prepared:', notification);
    return notification;
  } catch (error) {
    console.error('Error sending web push:', error);
    throw error;
  }
};

export default {
  sendPushNotification,
  sendSMSNotification,
  sendMedicineReminder,
  sendEscalationNotification,
  sendEmergencySosNotification,
  sendWebPushNotification
};
