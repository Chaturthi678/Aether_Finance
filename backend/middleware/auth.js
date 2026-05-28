import jwt from 'jsonwebtoken';

/**
 * Middleware to verify user JWT token from the Authorization header.
 */
export function checkUserEmail(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required." });
  }

  const jwtSecret = process.env.JWT_SECRET || 'aether_jwt_secret_key_2026_finance_engine';

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      console.error("[Auth Middleware] JWT Verification Failed:", err.message);
      return res.status(403).json({ error: "Session expired or invalid token." });
    }
    
    req.userEmail = decoded.email?.trim().toLowerCase();
    req.userTier = decoded.tier || 'free';
    next();
  });
}
