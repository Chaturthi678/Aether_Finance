import jwt from 'jsonwebtoken';
import { run, query } from '../db/db.js';
import { triggerLoginAlert } from '../services/notificationEngine.js';

const ROLES = ["College Student", "Software Engineer", "Small Business Owner", "Freelance UI Designer", "Data Analyst", "Product Manager", "Consultant", "Doctor"];
const CITIES = ["Ahmedabad", "Bangalore", "Delhi", "Mumbai", "Pune", "Hyderabad", "Chennai", "Kolkata"];

function getNameFromEmail(email) {
  const parts = email.split('@')[0].split(/[._-]/);
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

/**
 * Handle user login credentials authentication.
 */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const emailTrimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimmed)) {
    return res.status(400).json({ error: "Invalid email format." });
  }

  try {
    // Query user from SQLite
    const users = await query('SELECT * FROM users WHERE email = ?', [emailTrimmed]);
    let user = users[0] || null;

    if (user) {
      if (user.password && password !== user.password) {
        return res.status(401).json({ error: "Invalid password for this account." });
      }
    } else {
      // New user, dynamically register!
      const name = req.body.name || getNameFromEmail(emailTrimmed);
      const role = req.body.role || ROLES[Math.floor(Math.random() * ROLES.length)];
      const city = req.body.city || CITIES[Math.floor(Math.random() * CITIES.length)];
      
      user = {
        email: emailTrimmed,
        name,
        role,
        city,
        password: password,
        tier: 'free'
      };

      await run('INSERT INTO users (email, name, role, city, password, tier) VALUES (?, ?, ?, ?, ?, ?)',
        [user.email, user.name, user.role, user.city, user.password, user.tier]);
      
      console.log(`New user registered dynamically in SQLite: ${user.email}`);
    }

    console.log(`User authenticated: ${user.email}`);
    
    // Trigger login security alert in background
    triggerLoginAlert(user.email).catch(err => {
      console.error("Failed to send login security alert email:", err);
    });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'aether_jwt_secret_key_2026_finance_engine';
    const token = jwt.sign(
      { email: user.email, tier: user.tier || 'free' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        city: user.city,
        tier: user.tier || 'free'
      },
      token
    });
  } catch (error) {
    console.error("Login controller error:", error);
    res.status(500).json({ error: "Internal authentication error." });
  }
}
