import cron from 'node-cron';
import Medicine from '../models/Medicine.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendMedicineReminder, sendEscalationNotification } from './notificationService.js';

// ============ MEDICINE REMINDER SCHEDULER ============
// Runs every minute to check if any medicines need reminders
export const startMedicineReminderScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Find medicines scheduled for this time
      const medicines = await Medicine.find({
        scheduledTimes: currentTime,
        active: { $ne: false }
      }).populate('userId');

      for (const medicine of medicines) {
        const user = medicine.userId;

        // Create confirmation record if not exists
        const today = new Date().toISOString().split('T')[0];
        let confirmation = medicine.confirmations.find(
          c => new Date(c.date).toISOString().split('T')[0] === today &&
               c.time === currentTime
        );

        if (!confirmation) {
          confirmation = {
            date: now,
            time: currentTime,
            confirmed: false,
            smsAlertSent: false
          };
          medicine.confirmations.push(confirmation);
          await medicine.save();
        }

        // Send reminder
        await sendMedicineReminder(user, medicine, currentTime);

        // Save notification record
        await Notification.create({
          userId: user._id,
          medicineId: medicine._id,
          type: 'medicine-reminder',
          title: `Medicine Reminder - ${medicine.name}`,
          message: `Time to take ${medicine.name} (${medicine.dosage})`,
          channel: medicine.pushNotification ? 'push' : 'sms',
          metadata: {
            medicineName: medicine.name,
            dosage: medicine.dosage,
            time: currentTime
          }
        });

        console.log(`Reminder sent for ${medicine.name} at ${currentTime}`);
      }
    } catch (error) {
      console.error('Error in medicine reminder scheduler:', error);
    }
  });

  console.log('Medicine reminder scheduler started');
};

// ============ ESCALATION SCHEDULER ============
// Runs every 5 minutes to check for escalation (30 min timeout)
export const startEscalationScheduler = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const medicines = await Medicine.find({ active: { $ne: false } })
        .populate('userId');

      for (const medicine of medicines) {
        const user = medicine.userId;
        const today = new Date().toISOString().split('T')[0];
        const unconfirmedReminders = medicine.confirmations.filter(c => {
          const confirmDate = new Date(c.date).toISOString().split('T')[0];
          return confirmDate === today && !c.confirmed && !c.smsAlertSent;
        });

        for (const reminder of unconfirmedReminders) {
          const reminderTime = new Date(`${now.toISOString().split('T')[0]} ${reminder.time}`);
          const minutesPassed = (now - reminderTime) / (1000 * 60);

          // If more than 30 minutes have passed and not confirmed, escalate
          if (minutesPassed >= medicine.escalationMinutes) {
            await sendEscalationNotification(user, medicine, reminder.time);

            reminder.smsAlertSent = true;
            reminder.smsAlertSentAt = now;
            await medicine.save();

            // Save escalation notification
            await Notification.create({
              userId: user._id,
              medicineId: medicine._id,
              type: 'escalation',
              title: `Medicine Not Taken - ${medicine.name}`,
              message: `${user.name} hasn't taken ${medicine.name} since ${reminder.time}`,
              channel: 'sms',
              recipientPhone: medicine.smsContact,
              metadata: {
                medicineName: medicine.name,
                elderName: user.name,
                scheduledTime: reminder.time,
                minutesPassed: Math.round(minutesPassed)
              }
            });

            console.log(`Escalation sent for ${user.name} - ${medicine.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in escalation scheduler:', error);
    }
  });

  console.log('Escalation scheduler started');
};

// ============ DAILY RESET SCHEDULER ============
// Resets medicine confirmations every day at midnight
export const startDailyResetScheduler = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Daily reset: Clearing confirmations for new day');
      // This is handled in the confirmation tracking
    } catch (error) {
      console.error('Error in daily reset scheduler:', error);
    }
  });

  console.log('Daily reset scheduler started');
};

export default {
  startMedicineReminderScheduler,
  startEscalationScheduler,
  startDailyResetScheduler
};
