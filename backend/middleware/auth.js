import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// ============ VERIFY JWT MIDDLEWARE ============
export const verifyJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ============ ERROR HANDLER MIDDLEWARE ============
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    statusCode
  });
};

// ============ RATE LIMITER ============
const requestCounts = new Map();

export const rateLimiter = (limit = 100, window = 60000) => {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, []);
    }

    const requests = requestCounts.get(ip);
    const recentRequests = requests.filter(time => now - time < window);

    if (recentRequests.length >= limit) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    next();
  };
};

export default {
  verifyJWT,
  errorHandler,
  rateLimiter
};
