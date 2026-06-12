import Medicine from '../models/Medicine.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendMedicineReminder, sendPushNotification } from '../services/notificationService.js';

// ============ GET ALL MEDICINES ============
export const getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ userId: req.userId });
    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ GET SINGLE MEDICINE ============
export const getMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.medicineId,
      userId: req.userId
    });

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ ADD MEDICINE ============
export const addMedicine = async (req, res) => {
  try {
    const { name, dosage, frequency, scheduledTimes, smsAlert, smsContact, pushNotification } = req.body;

    const medicine = new Medicine({
      userId: req.userId,
      name,
      dosage,
      frequency,
      scheduledTimes,
      smsAlert: smsAlert !== false,
      smsContact,
      pushNotification: pushNotification !== false,
      startDate: new Date(),
      confirmations: []
    });

    await medicine.save();

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: medicine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ UPDATE MEDICINE ============
export const updateMedicine = async (req, res) => {
  try {
    const { name, dosage, frequency, scheduledTimes, smsAlert, smsContact, pushNotification, endDate } = req.body;

    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.medicineId, userId: req.userId },
      {
        name,
        dosage,
        frequency,
        scheduledTimes,
        smsAlert,
        smsContact,
        pushNotification,
        endDate
      },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ DELETE MEDICINE ============
export const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndDelete({
      _id: req.params.medicineId,
      userId: req.userId
    });

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ CONFIRM MEDICINE TAKEN ============
export const confirmMedicineTaken = async (req, res) => {
  try {
    const { time } = req.body;
    const medicine = await Medicine.findOne({
      _id: req.params.medicineId,
      userId: req.userId
    });

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const today = new Date().toISOString().split('T')[0];
    let confirmation = medicine.confirmations.find(
      c => new Date(c.date).toISOString().split('T')[0] === today && c.time === time
    );

    if (confirmation) {
      confirmation.confirmed = true;
      confirmation.confirmedAt = new Date();
      confirmation.smsAlertSent = false; // Clear escalation since medicine was taken
    } else {
      confirmation = {
        date: new Date(),
        time,
        confirmed: true,
        confirmedAt: new Date(),
        smsAlertSent: false
      };
      medicine.confirmations.push(confirmation);
    }

    await medicine.save();

    // Save confirmation notification
    await Notification.create({
      userId: req.userId,
      medicineId: medicine._id,
      type: 'medicine-reminder',
      title: 'Medicine Confirmed',
      message: `${medicine.name} marked as taken at ${time}`,
      status: 'seen',
      channel: 'push'
    });

    res.json({
      success: true,
      message: 'Medicine marked as taken',
      data: confirmation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ GET TODAY'S MEDICINES ============
export const getTodaysMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ userId: req.userId });
    const today = new Date().toISOString().split('T')[0];

    const todaysMedicines = medicines.map(medicine => {
      const todaysConfirmations = medicine.confirmations.filter(
        c => new Date(c.date).toISOString().split('T')[0] === today
      );

      return {
        ...medicine.toObject(),
        todaysConfirmations
      };
    });

    res.json({
      success: true,
      data: todaysMedicines
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ GET MEDICINE CONFIRMATIONS ============
export const getMedicineConfirmations = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({
      _id: req.params.medicineId,
      userId: req.userId
    });

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    // Get confirmations for past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const confirmations = medicine.confirmations.filter(
      c => new Date(c.date) >= thirtyDaysAgo
    );

    res.json({
      success: true,
      data: {
        medicineName: medicine.name,
        confirmations,
        stats: {
          total: confirmations.length,
          taken: confirmations.filter(c => c.confirmed).length,
          missed: confirmations.filter(c => !c.confirmed).length,
          complianceRate: confirmations.length > 0 
            ? Math.round((confirmations.filter(c => c.confirmed).length / confirmations.length) * 100)
            : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ GET 30-DAY ADHERENCE STATS ============
export const getAdherenceStats = async (req, res) => {
  try {
    const medicines = await Medicine.find({ userId: req.userId });

    const today = new Date();
    const dailyBreakdown = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Count how many medicines had at least one confirmation on this day
      let takenCount = 0;
      let totalCount = medicines.length;

      for (const medicine of medicines) {
        const dayConfirmations = medicine.confirmations.filter(c => {
          const cDate = new Date(c.date).toISOString().split('T')[0];
          return cDate === dateStr && c.confirmed;
        });
        if (dayConfirmations.length > 0) takenCount++;
      }

      dailyBreakdown.push({
        date: dateStr,
        taken: takenCount,
        total: totalCount,
        percent: totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0
      });
    }

    // Calculate overall: days where at least 1 medicine was taken
    const takenDays = dailyBreakdown.filter(d => d.taken > 0).length;
    const totalDays = 30;
    const adherencePercent = Math.round((takenDays / totalDays) * 100);

    res.json({
      success: true,
      data: {
        adherencePercent,
        takenDays,
        totalDays,
        dailyBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  getAllMedicines,
  getMedicine,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  confirmMedicineTaken,
  getTodaysMedicines,
  getMedicineConfirmations,
  getAdherenceStats
};
