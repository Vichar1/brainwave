/**
 * HACKATHON 1.0 — Admin Routes
 * Login, View Teams, Delete Teams
 * 
 * SECURITY: No fallback secrets, audit logging, hardened JWT
 */

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

// SECURITY: No fallback secret — app MUST have JWT_SECRET in .env
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('✗ FATAL: JWT_SECRET is missing or too short. Set a 64+ char secret in .env');
  process.exit(1);
}

const JWT_EXPIRES = '8h'; // Shortened from 24h for security

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,  // Reduced from 10 — 5 attempts per 15 min
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    
    // SECURITY: Validate token is not empty and is a reasonable length
    if (!token || token.length < 10 || token.length > 2048) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'], // Explicitly restrict to HS256 — prevents algorithm confusion attacks
      maxAge: '8h',
    });
    req.admin = decoded;
    next();
  } catch (err) {
    // SECURITY: Don't reveal whether token is expired vs. invalid
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export default function adminRoutes(db) {
  const router = Router();

  // ============================================
  // LOGIN
  // ============================================
  router.post('/login', loginLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;

      // SECURITY: Input validation
      if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Username and password required' });
      }

      if (username.length > 50 || password.length > 128) {
        return res.status(400).json({ error: 'Invalid credential format' });
      }

      const admin = await db.getAdmin(username.trim());

      // SECURITY: Constant-time comparison — always run bcrypt even if user not found
      // Prevents timing attacks that reveal valid usernames
      const dummyHash = '$2b$12$InvalidHashForTimingProtection000000000000000000000';
      const hashToCompare = admin ? admin.password : dummyHash;
      const isValid = bcrypt.compareSync(password, hashToCompare);

      if (!admin || !isValid) {
        // SECURITY: Audit log for failed login attempts
        console.warn(`⚠ Failed login attempt for user: "${username.substring(0, 20)}" from ${req.ip}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username },
        JWT_SECRET,
        { 
          expiresIn: JWT_EXPIRES,
          algorithm: 'HS256',
        }
      );

      console.log(`✓ Admin login: ${admin.username} from ${req.ip}`);

      res.json({ token, username: admin.username });

    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // ============================================
  // GET ALL TEAMS
  // ============================================
  router.get('/teams', authMiddleware, async (req, res) => {
    try {
      const teams = await db.getAllTeams();
      res.json({ teams, total: teams.length });
    } catch (err) {
      console.error('Fetch teams error:', err.message);
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  });

  // ============================================
  // GET STATS
  // ============================================
  router.get('/stats', authMiddleware, async (req, res) => {
    try {
      const stats = await db.getStats();
      res.json(stats);
    } catch (err) {
      console.error('Stats error:', err.message);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // ============================================
  // GET SINGLE TEAM
  // ============================================
  router.get('/teams/:teamId', authMiddleware, async (req, res) => {
    try {
      const { teamId } = req.params;
      
      // SECURITY: Validate teamId format
      if (!teamId || typeof teamId !== 'string' || !/^HK-[A-F0-9]{8}$/.test(teamId)) {
        return res.status(400).json({ error: 'Invalid team ID format' });
      }

      const team = await db.getTeam(teamId);

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      res.json(team);

    } catch (err) {
      console.error('Fetch team error:', err.message);
      res.status(500).json({ error: 'Failed to fetch team' });
    }
  });

  // ============================================
  // DELETE TEAM
  // ============================================
  router.delete('/teams/:teamId', authMiddleware, async (req, res) => {
    try {
      const { teamId } = req.params;

      // SECURITY: Validate teamId format
      if (!teamId || typeof teamId !== 'string' || !/^HK-[A-F0-9]{8}$/.test(teamId)) {
        return res.status(400).json({ error: 'Invalid team ID format' });
      }

      const team = await db.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      await db.deleteTeam(teamId);

      // SECURITY: Audit log for destructive actions
      console.log(`✗ Team deleted: ${teamId} by admin ${req.admin.username} from ${req.ip}`);
      res.json({ success: true, message: 'Team deleted' });

    } catch (err) {
      console.error('Delete error:', err.message);
      res.status(500).json({ error: 'Failed to delete team' });
    }
  });

  return router;
}
