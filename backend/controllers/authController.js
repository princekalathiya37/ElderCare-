import User from '../models/User.js';
import * as authService from '../services/authService.js';
import jwt from 'jsonwebtoken';

// ============ REGISTER ============
export const register = async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await authService.registerUser({
      email,
      password,
      name,
      phone,
      role
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ LOGIN ============
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await authService.loginUser(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// ============ GOOGLE LOGIN ============
export const googleLogin = async (req, res) => {
  try {
    const { credential, name, email, googleId } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Google credentials required' });
    }

    // Find or create user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Create new user via Google
      user = new User({
        name: name || email.split('@')[0],
        email,
        googleId,
        password: 'google-oauth-' + googleId, // placeholder, not used for auth
        role: req.body.role || 'elder'
      });
      await user.save();
    } else if (!user.googleId) {
      // Link existing account with Google
      user.googleId = googleId;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Google login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ UPDATE USER PROFILE ============
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, age, bloodGroup, medicalConditions, allergies, specialization } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (age !== undefined) updateData.age = age;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (medicalConditions !== undefined) updateData.medicalConditions = medicalConditions;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (specialization !== undefined) updateData.specialization = specialization;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ UPDATE FCM TOKEN ============
export const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token required' });
    }

    const user = await authService.updateFCMToken(req.userId, fcmToken);

    res.json({
      success: true,
      message: 'FCM token updated',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        fcmToken: user.fcmToken
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ SAVE PUSH SUBSCRIPTION ============
export const savePushSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription required' });
    }

    const user = await authService.savePushSubscription(req.userId, subscription);

    res.json({
      success: true,
      message: 'Push subscription saved',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ UPDATE EMERGENCY CONTACTS ============
export const updateEmergencyContacts = async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Contacts must be an array' });
    }

    const user = await authService.updateEmergencyContacts(req.userId, contacts);

    res.json({
      success: true,
      message: 'Emergency contacts updated',
      contacts: user.emergencyContacts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ GET USER PROFILE ============
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ UPDATE NOTIFICATION PREFERENCES ============
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { medicineReminders, appointmentReminders, sosAlerts, dailyHealthSummary } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          'notificationPreferences.medicineReminders': medicineReminders,
          'notificationPreferences.appointmentReminders': appointmentReminders,
          'notificationPreferences.sosAlerts': sosAlerts,
          'notificationPreferences.dailyHealthSummary': dailyHealthSummary
        }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Notification preferences updated',
      notificationPreferences: user.notificationPreferences
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  register,
  login,
  googleLogin,
  updateProfile,
  updateFCMToken,
  savePushSubscription,
  updateEmergencyContacts,
  getUserProfile,
  updateNotificationPreferences
};
