import admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

// Initialize Firebase Admin SDK (Optional - works without it for dev)
let firebaseInitialized = false;
try {
  const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  };

  if (firebaseConfig.projectId && firebaseConfig.privateKey && firebaseConfig.clientEmail) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig)
      });
      firebaseInitialized = true;
      console.log('✓ Firebase initialized');
    }
  } else {
    console.log('⚠️  Firebase credentials not found - push notifications disabled');
  }
} catch (err) {
  console.log('⚠️  Firebase initialization failed');
  console.log('   Error:', err.message);
}

// Initialize Email Service (HTTP API Providers or Gmail SMTP)
let emailTransporter = null;
let emailInitialized = false;
let emailServiceType = 'mock'; // 'gmail', 'resend', 'brevo', 'sendgrid', 'mock'

if (process.env.RESEND_API_KEY) {
  emailInitialized = true;
  emailServiceType = 'resend';
  console.log('✓ Email Service (Resend HTTP API) initialized');
} else if (process.env.BREVO_API_KEY) {
  emailInitialized = true;
  emailServiceType = 'brevo';
  console.log('✓ Email Service (Brevo HTTP API) initialized');
} else if (process.env.SENDGRID_API_KEY) {
  emailInitialized = true;
  emailServiceType = 'sendgrid';
  console.log('✓ Email Service (SendGrid HTTP API) initialized');
} else if (process.env.BREVO_SMTP_KEY && process.env.BREVO_SMTP_LOGIN) {
  // Brevo SMTP via nodemailer (uses xsmtpsib-... key)
  try {
    emailTransporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_KEY
      },
      connectionTimeout: 15000,
      socketTimeout: 15000
    });
    emailInitialized = true;
    emailServiceType = 'brevo-smtp';
    console.log('✓ Email Service (Brevo SMTP) initialized');
  } catch (err) {
    console.log('⚠️  Email Service (Brevo SMTP) initialization failed');
    console.log('   Error:', err.message);
  }
} else {
  try {
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        },
        connectionTimeout: 10000, // 10 seconds timeout for establishing connection
        socketTimeout: 10000 // 10 seconds timeout for data transfer
      });
      emailInitialized = true;
      emailServiceType = 'gmail';
      console.log('✓ Email Service (Nodemailer/Gmail SMTP) initialized');
    } else {
      console.log('⚠️  No email provider API keys or Gmail credentials configured - email alerts disabled (mock mode)');
    }
  } catch (err) {
    console.log('⚠️  Email Service (Gmail SMTP) initialization failed');
    console.log('   Error:', err.message);
  }
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
        fcmOptions: { link: '/' },
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
    return { error: error.message, mock: true };
  }
};

// ============ EMAIL NOTIFICATION SERVICE ============
export const sendEmailNotification = async (toEmail, subject, textBody, htmlBody) => {
  try {
    if (!toEmail) {
      console.log('No email address provided for notification');
      return null;
    }

    if (!emailInitialized) {
      console.log('ℹ️  Email (mock mode) to', toEmail, ':', subject);
      return { messageId: 'mock-email-' + Date.now(), mock: true };
    }

    if (emailServiceType === 'resend') {
      const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
      const response = await axios.post('https://api.resend.com/emails', {
        from: `ElderCare+ Alert System <${fromEmail}>`,
        to: toEmail,
        subject,
        text: textBody,
        html: htmlBody
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✓ Email sent via Resend API to', toEmail, ':', response.data.id);
      return { messageId: response.data.id };
    }

    if (emailServiceType === 'brevo') {
      const fromEmail = process.env.EMAIL_FROM || 'sender@example.com';
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: 'ElderCare+ Alert System', email: fromEmail },
        to: [{ email: toEmail }],
        subject,
        textContent: textBody,
        htmlContent: htmlBody
      }, {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      console.log('✓ Email sent via Brevo API to', toEmail, ':', response.data.messageId);
      return { messageId: response.data.messageId };
    }

    if (emailServiceType === 'sendgrid') {
      const fromEmail = process.env.EMAIL_FROM || 'sender@example.com';
      const response = await axios.post('https://api.sendgrid.com/v3/mail/send', {
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: fromEmail, name: 'ElderCare+ Alert System' },
        subject,
        content: [
          { type: 'text/plain', value: textBody },
          { type: 'text/html', value: htmlBody }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✓ Email sent via SendGrid API to', toEmail);
      return { messageId: 'sendgrid-' + Date.now() };
    }

    if (emailServiceType === 'brevo-smtp' && emailTransporter) {
      const fromEmail = process.env.EMAIL_FROM || process.env.BREVO_SMTP_LOGIN;
      const info = await emailTransporter.sendMail({
        from: `"ElderCare+ Alert System" <${fromEmail}>`,
        to: toEmail,
        subject,
        text: textBody,
        html: htmlBody
      });
      console.log('✓ Email sent via Brevo SMTP to', toEmail, ':', info.messageId);
      return info;
    }

    if (emailServiceType === 'gmail' && emailTransporter) {
      const info = await emailTransporter.sendMail({
        from: `"ElderCare+ Alert System" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject,
        text: textBody,
        html: htmlBody
      });
      console.log('✓ Email sent via Gmail SMTP to', toEmail, ':', info.messageId);
      return info;
    }

    // Fallback if configured but type is mismatched
    console.log('ℹ️  Email (mock mode fallback) to', toEmail, ':', subject);
    return { messageId: 'mock-email-' + Date.now(), mock: true };

  } catch (error) {
    console.error('Error sending email to', toEmail, ':', error.response?.data || error.message);
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    return { error: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg };
  }
};

// ============ MEDICINE REMINDER NOTIFICATION ============
export const sendMedicineReminder = async (user, medicine, time) => {
  const title = '💊 Medicine Reminder';
  const body = `Time to take ${medicine.name} (${medicine.dosage})`;

  // Send push notification
  if (medicine.pushNotification && user.fcmToken) {
    await sendPushNotification(user.fcmToken, title, body, {
      type: 'medicine-reminder',
      medicineId: medicine._id.toString(),
      medicineName: medicine.name,
      dosage: medicine.dosage,
      time
    });
  }
};

// ============ ESCALATION NOTIFICATION (30 MIN — medicine not taken) ============
export const sendEscalationNotification = async (user, medicine, time) => {
  // Fetch full user with emergency contacts
  const User = (await import('../models/User.js')).default;
  const fullUser = await User.findById(user._id || user);

  if (!fullUser) {
    console.log('Could not find user for escalation notification');
    return;
  }

  const escalationEmailResults = [];

  if (!fullUser.emergencyContacts || fullUser.emergencyContacts.length === 0) {
    console.log(`No emergency contacts to notify for ${fullUser.name}'s missed medicine`);
    return escalationEmailResults;
  }

  const subject = `⚠️ Medicine Alert: ${fullUser.name} hasn't taken ${medicine.name}`;
  const textBody = `MEDICINE ALERT\n\n${fullUser.name} has not taken ${medicine.name} (${medicine.dosage}) scheduled at ${time}.\n\nIt has been more than 30 minutes past the scheduled time. Please check on them.\n\n— ElderCare+ Alert System`;
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #f59e0b; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center; font-size: 22px; font-weight: bold;">
        ⚠️ Medicine Alert
      </div>
      <div style="padding: 24px; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-top: 0; color: #d97706;">${fullUser.name} hasn't taken their medicine</h2>
        <p>This is an automated alert from the <strong>ElderCare+</strong> platform.</p>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #92400e;">Medicine Details:</p>
          <p style="margin: 8px 0 0 0;">
            💊 <strong>${medicine.name}</strong> — ${medicine.dosage}<br/>
            ⏰ Scheduled at: <strong>${time}</strong><br/>
            ⌛ More than 30 minutes have passed without confirmation.
          </p>
        </div>

        <p>Please check on <strong>${fullUser.name}</strong> and ensure they take their medication.</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
          This alert was sent by ElderCare+ on behalf of ${fullUser.name}.
        </div>
      </div>
    </div>
  `;

  const emailPromises = fullUser.emergencyContacts.map(async (contact) => {
    if (!contact.email) {
      console.log(`No email for emergency contact ${contact.name}, skipping escalation`);
      return { name: contact.name, status: 'skipped', reason: 'No email set' };
    }

    try {
      const result = await sendEmailNotification(contact.email, subject, textBody, htmlBody);
      return {
        name: contact.name,
        email: contact.email,
        status: result && !result.error ? 'sent' : 'failed',
        error: result?.error || null
      };
    } catch (error) {
      console.error(`Error emailing contact ${contact.name} for escalation:`, error);
      return {
        name: contact.name,
        email: contact.email,
        status: 'failed',
        error: error.message
      };
    }
  });

  const results = await Promise.all(emailPromises);
  escalationEmailResults.push(...results);

  return escalationEmailResults;
};

// ============ EMERGENCY SOS NOTIFICATION ============
export const sendEmergencySosNotification = async (user, location) => {
  // Extract coordinates — handles flat {lat, lng} or nested {location: {lat, lng}}
  const locObj = (location && typeof location.lat !== 'undefined') ? location
    : (location && location.location) ? location.location
    : location;
  const lat = locObj?.lat ?? locObj?.latitude ?? null;
  const lng = locObj?.lng ?? locObj?.longitude ?? null;
  const addressStr = lat && lng
    ? `GPS: ${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`
    : 'Unknown Location';
  const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;
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

  const deliveryResults = [];

  if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
    sosData.deliveryResults = [];
    return sosData;
  }

  // Email emergency contacts in parallel
  const emailPromises = user.emergencyContacts.map(async (contact) => {
    if (!contact.email) {
      return {
        name: contact.name,
        email: 'Not set',
        emailStatus: 'skipped',
        emailError: 'No email address configured for this contact'
      };
    }

    try {
      const emailSubject = `🚨 EMERGENCY SOS ALERT: ${user.name} needs help!`;
      const emailText = `EMERGENCY SOS ALERT\n\n${user.name} has triggered an Emergency SOS!\n\nLocation: ${addressStr}\n${mapsUrl ? 'Maps: ' + mapsUrl : ''}\n\nProfile Details:\n- Age: ${user.age || 'Not set'}\n- Blood Group: ${user.bloodGroup || 'Not set'}\n- Medical Conditions: ${conditionsStr}\n- Allergies: ${allergiesStr}\n\nPlease contact them or emergency services immediately.\n\n— ElderCare+ Emergency System`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 3px solid #ef4444; border-radius: 8px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 24px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 8px;">🚨</div>
            <div style="font-size: 26px; font-weight: bold;">EMERGENCY SOS ALERT</div>
          </div>
          <div style="padding: 28px; line-height: 1.6; color: #1f2937;">
            <h2 style="margin-top: 0; color: #ef4444; font-size: 22px;">${user.name} needs immediate assistance!</h2>
            <p style="font-size: 15px;">This is an automated emergency alert from the <strong>ElderCare+</strong> platform.</p>

            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 18px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 15px;">📍 Current Location:</p>
              <p style="margin: 8px 0 4px 0; font-size: 15px;">${addressStr}</p>
              ${mapsUrl ? `<a href="${mapsUrl}" style="display: inline-block; margin-top: 10px; background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;" target="_blank">📍 View on Google Maps</a>` : ''}
            </div>

            <h3 style="border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px; color: #374151;">Medical Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; font-weight: bold; color: #6b7280; width: 160px; border: 1px solid #e5e7eb;">Age</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${user.age || 'Not set'}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #6b7280; border: 1px solid #e5e7eb;">Blood Group</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${user.bloodGroup || 'Not set'}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 10px; font-weight: bold; color: #6b7280; border: 1px solid #e5e7eb;">Medical Conditions</td>
                <td style="padding: 10px; color: #b91c1c; font-weight: 500; border: 1px solid #e5e7eb;">${conditionsStr}</td>
              </tr>
              <tr>
                <td style="padding: 10px; font-weight: bold; color: #6b7280; border: 1px solid #e5e7eb;">Allergies</td>
                <td style="padding: 10px; color: #b91c1c; font-weight: 500; border: 1px solid #e5e7eb;">${allergiesStr}</td>
              </tr>
            </table>

            <div style="margin-top: 24px; padding: 16px; background: #fef2f2; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 15px;">Please contact ${user.name} or call emergency services (911) immediately!</p>
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
              This alert was automatically sent by ElderCare+ Emergency Alert System.
            </div>
          </div>
        </div>
      `;

      const res = await sendEmailNotification(contact.email, emailSubject, emailText, emailHtml);

      return {
        name: contact.name,
        email: contact.email,
        emailStatus: (res && res.error) ? 'failed' : 'sent',
        emailError: res?.error || null,
        isMock: !emailInitialized || (res && res.mock) ? true : false
      };

    } catch (error) {
      console.error(`Error emailing contact ${contact.name}:`, error);
      return {
        name: contact.name,
        email: contact.email,
        emailStatus: 'failed',
        emailError: error.message
      };
    }
  });

  const results = await Promise.all(emailPromises);
  deliveryResults.push(...results);

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

    const notification = {
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.type || 'notification',
      requireInteraction: data.type === 'emergency-sos',
      data
    };

    console.log('Web push notification prepared:', notification);
    return notification;
  } catch (error) {
    console.error('Error sending web push:', error);
    throw error;
  }
};

export default {
  sendPushNotification,
  sendEmailNotification,
  sendMedicineReminder,
  sendEscalationNotification,
  sendEmergencySosNotification,
  sendWebPushNotification
};
