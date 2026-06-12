import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// ============ REGISTER USER ============
export const registerUser = async (userData) => {
  try {
    const { email, password, name, phone, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'elder'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    };
  } catch (error) {
    throw error;
  }
};

// ============ LOGIN USER ============
export const loginUser = async (email, password) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    // Compare passwords
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    return {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        fcmToken: user.fcmToken,
        emergencyContacts: user.emergencyContacts
      }
    };
  } catch (error) {
    throw error;
  }
};

// ============ VERIFY TOKEN ============
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// ============ UPDATE FCM TOKEN ============
export const updateFCMToken = async (userId, fcmToken) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true }
    );
    return user;
  } catch (error) {
    throw error;
  }
};

// ============ SAVE PUSH SUBSCRIPTION ============
export const savePushSubscription = async (userId, subscription) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { pushSubscription: subscription },
      { new: true }
    );
    return user;
  } catch (error) {
    throw error;
  }
};

// ============ UPDATE EMERGENCY CONTACTS ============
export const updateEmergencyContacts = async (userId, contacts) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { emergencyContacts: contacts },
      { new: true }
    );
    return user;
  } catch (error) {
    throw error;
  }
};

export default {
  registerUser,
  loginUser,
  verifyToken,
  updateFCMToken,
  savePushSubscription,
  updateEmergencyContacts
};
