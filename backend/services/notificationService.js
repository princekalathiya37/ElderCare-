import admin from 'firebase-admin';
import twilio from 'twilio';
import axios from 'axios';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

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

// Initialize Nodemailer for Email alerts (Gmail SMTP)
let emailTransporter = null;
let emailInitialized = false;
try {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    emailInitialized = true;
    console.log('✓ Email Service (Nodemailer) initialized');
  } else {
    console.log('⚠️  Email credentials not found - running in mock mode');
  }
} catch (err) {
  console.log('⚠️  Email Service initialization failed - running in mock mode');
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

// ============ EMAIL NOTIFICATION SERVICE ============
export const sendEmailNotification = async (toEmail, subject, text, html) => {
  try {
    if (!toEmail) {
      console.log('No email address provided for notification');
      return null;
    }

    if (emailInitialized && emailTransporter) {
      const info = await emailTransporter.sendMail({
        from: `"ElderCare+ Emergency System" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject,
        text,
        html
      });
      console.log('Email sent:', info.messageId);
      return info;
    } else {
      console.log('ℹ️  Email (mock mode) to', toEmail, ':', subject);
      return { messageId: 'mock-email-' + Date.now() };
    }
  } catch (error) {
    console.error('Error sending email:', error);
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
  // Extract coordinates — handles flat {lat, lng} or nested {location: {lat, lng}}
  const locObj = (location && typeof location.lat !== 'undefined') ? location
    : (location && location.location) ? location.location
    : location;
  const lat = locObj?.lat ?? locObj?.latitude ?? null;
  const lng = locObj?.lng ?? locObj?.longitude ?? null;
  const addressStr = lat && lng ? `GPS: ${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}` : 'Unknown Location';
  const mapLink = lat && lng ? ` Maps: https://www.google.com/maps?q=${lat},${lng}` : '';
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

  const deliveryResults = [];

  // Notify all emergency contacts
  for (const contact of user.emergencyContacts) {
    try {
      // Send SMS (if number is set)
      let smsResult = null;
      if (contact.phone) {
        const smsMessage = `🚨 EMERGENCY: ${user.name} (Age: ${user.age || 'Not set'}, Blood: ${user.bloodGroup || 'Not set'}) has activated SOS at ${addressStr}.${mapLink} Medical Conditions: ${conditionsStr}. Allergies: ${allergiesStr}`;
        const res = await sendSMSNotification(contact.phone, smsMessage);
        smsResult = {
          status: (!twilioInitialized || (res && res.error)) ? 'failed' : 'sent',
          error: !twilioInitialized 
            ? 'Twilio is running in Mock Mode. Configure TWILIO credentials for live SMS.' 
            : (res?.error || null)
        };
      }

      // Send email if set
      let emailResult = null;
      if (contact.email) {
        const emailSubject = `🚨 EMERGENCY SOS ALERT: ${user.name} needs help!`;
        const emailText = `EMERGENCY SOS ALERT\n\n${user.name} has triggered an Emergency SOS!\n\nLocation: ${addressStr}\n${mapLink}\n\nProfile Details:\n- Age: ${user.age || 'Not set'}\n- Blood Group: ${user.bloodGroup || 'Not set'}\n- Medical Conditions: ${conditionsStr}\n- Allergies: ${allergiesStr}\n\nPlease contact them or emergency services immediately.`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #ef4444; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center; font-size: 24px; font-weight: bold;">
              🚨 EMERGENCY SOS ALERT
            </div>
            <div style="padding: 24px; line-height: 1.6; color: #1f2937;">
              <h2 style="margin-top: 0; color: #ef4444;">${user.name} needs immediate assistance!</h2>
              <p>This is an automated emergency alert from the <strong>ElderCare+</strong> platform.</p>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #991b1b;">Current Location:</p>
                <p style="margin: 8px 0 0 0; font-size: 16px;">
                  📍 ${addressStr}
                  ${lat && lng ? `<br/><a href="https://www.google.com/maps?q=${lat},${lng}" style="display: inline-block; margin-top: 10px; background-color: #ef4444; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold;" target="_blank">View on Google Maps</a>` : ''}
                </p>
              </div>

              <h3 style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px;">Elder Profile Details</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; width: 150px; color: #4b5563;">Age:</td>
                  <td style="padding: 6px 0;">${user.age || 'Not set'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #4b5563;">Blood Group:</td>
                  <td style="padding: 6px 0;">${user.bloodGroup || 'Not set'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #4b5563;">Medical Conditions:</td>
                  <td style="padding: 6px 0; color: #b91c1c; font-weight: 500;">${conditionsStr}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #4b5563;">Allergies:</td>
                  <td style="padding: 6px 0; color: #b91c1c; font-weight: 500;">${allergiesStr}</td>
                </tr>
              </table>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
                Please contact ${user.name} or emergency services immediately.
              </div>
            </div>
          </div>
        `;
        
        const res = await sendEmailNotification(contact.email, emailSubject, emailText, emailHtml);
        emailResult = {
          status: (!emailInitialized || (res && res.error)) ? 'failed' : 'sent',
          error: !emailInitialized
            ? 'Gmail SMTP credentials not configured in environment.'
            : (res?.error || null)
        };
      }

      deliveryResults.push({
        name: contact.name,
        phone: contact.phone || 'Not set',
        email: contact.email || 'Not set',
        smsStatus: smsResult ? smsResult.status : 'not_attempted',
        smsError: smsResult ? smsResult.error : null,
        emailStatus: emailResult ? emailResult.status : 'not_attempted',
        emailError: emailResult ? emailResult.error : null
      });

    } catch (error) {
      console.error(`Error notifying contact ${contact.name}:`, error);
      deliveryResults.push({
        name: contact.name,
        phone: contact.phone || 'Not set',
        email: contact.email || 'Not set',
        smsStatus: 'failed',
        smsError: error.message,
        emailStatus: contact.email ? 'failed' : 'not_attempted',
        emailError: contact.email ? error.message : null
      });
    }
  }

  sosData.deliveryResults = deliveryResults;
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
  sendEmailNotification,
  sendMedicineReminder,
  sendEscalationNotification,
  sendEmergencySosNotification,
  sendWebPushNotification
};
