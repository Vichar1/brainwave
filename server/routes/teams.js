/**
 * HACKATHON 1.0 — Team Registration Routes
 * POST /api/teams/register
 * 
 * SECURITY: Strict input validation, length limits, character filtering
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import validator from 'validator';
import { appendToGoogleSheet } from '../googleSheets.js';

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// SECURITY: Strict field length limits
const LIMITS = {
  teamName: { min: 2, max: 50 },
  name: { min: 1, max: 100 },
  usn: { min: 2, max: 20 },
  email: { max: 100 },
  phone: { exact: 10 },
  teamSizeMin: 3,
  teamSizeMax: 5,
};

// SECURITY: Whitelist for team name characters (alphanumeric, spaces, hyphens, underscores)
const TEAM_NAME_REGEX = /^[a-zA-Z0-9\s\-_'.]+$/;

export default function teamRoutes(db) {
  const router = Router();

  // ============================================
  // REGISTER TEAM
  // ============================================
  router.post('/register', registrationLimiter, async (req, res) => {
    try {
      const { teamName, domain, teamSize, participants } = req.body;

      // ---- TYPE GUARDS ----
      if (typeof teamName !== 'string' || typeof domain !== 'string' || typeof teamSize !== 'number') {
        return res.status(400).json({ error: 'Invalid request format' });
      }

      // ---- TEAM NAME VALIDATION ----
      const trimmedName = teamName.trim();
      if (trimmedName.length < LIMITS.teamName.min || trimmedName.length > LIMITS.teamName.max) {
        return res.status(400).json({ error: `Team name must be ${LIMITS.teamName.min}-${LIMITS.teamName.max} characters` });
      }
      if (!TEAM_NAME_REGEX.test(trimmedName)) {
        return res.status(400).json({ error: 'Team name contains invalid characters. Use letters, numbers, spaces, hyphens only.' });
      }

      // ---- DOMAIN VALIDATION ----
      const validDomains = [
        'Web Development', 'Mobile App Development', 'AI / Machine Learning',
        'IoT / Hardware', 'Blockchain', 'Cybersecurity',
        'Game Development', 'Open Innovation'
      ];
      if (!validDomains.includes(domain)) {
        return res.status(400).json({ error: 'Invalid domain selected' });
      }

      // ---- TEAM SIZE VALIDATION ----
      if (!Number.isInteger(teamSize) || teamSize < LIMITS.teamSizeMin || teamSize > LIMITS.teamSizeMax) {
        return res.status(400).json({ error: `Team size must be between ${LIMITS.teamSizeMin} and ${LIMITS.teamSizeMax}` });
      }

      // ---- PARTICIPANTS VALIDATION ----
      if (!Array.isArray(participants) || participants.length !== teamSize) {
        return res.status(400).json({ error: `Expected ${teamSize} participants` });
      }

      // SECURITY: Protect against oversized arrays
      if (participants.length > LIMITS.teamSizeMax) {
        return res.status(400).json({ error: 'Too many participants' });
      }

      const sanitizedParticipants = [];
      const usns = new Set();

      for (let i = 0; i < participants.length; i++) {
        const p = participants[i];

        // SECURITY: Type guard each participant
        if (!p || typeof p !== 'object') {
          return res.status(400).json({ error: `Participant ${i + 1}: Invalid data` });
        }

        // Name validation + length limit
        if (!p.name || typeof p.name !== 'string' || p.name.trim().length === 0) {
          return res.status(400).json({ error: `Participant ${i + 1}: Name is required` });
        }
        if (p.name.trim().length > LIMITS.name.max) {
          return res.status(400).json({ error: `Participant ${i + 1}: Name too long (max ${LIMITS.name.max})` });
        }

        // USN validation + length limit
        if (!p.usn || typeof p.usn !== 'string' || p.usn.trim().length === 0) {
          return res.status(400).json({ error: `Participant ${i + 1}: USN is required` });
        }
        if (p.usn.trim().length > LIMITS.usn.max) {
          return res.status(400).json({ error: `Participant ${i + 1}: USN too long (max ${LIMITS.usn.max})` });
        }

        // Branch validation (strict whitelist)
        if (!p.branch || !['CSE', 'CSD'].includes(p.branch)) {
          return res.status(400).json({ error: `Participant ${i + 1}: Invalid branch` });
        }

        // Semester validation (strict whitelist)
        if (!p.semester || !['2nd Sem', '4th Sem', '6th Sem'].includes(p.semester)) {
          return res.status(400).json({ error: `Participant ${i + 1}: Invalid semester` });
        }

        // Phone validation + length limit
        const cleanPhone = typeof p.phone === 'string' ? p.phone.replace(/\s/g, '') : '';
        if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
          return res.status(400).json({ error: `Participant ${i + 1}: Invalid phone number` });
        }

        // Email validation + length limit
        if (!p.email || typeof p.email !== 'string' || p.email.length > LIMITS.email.max || !validator.isEmail(p.email)) {
          return res.status(400).json({ error: `Participant ${i + 1}: Invalid email` });
        }

        // USN uniqueness within team
        const usnUpper = p.usn.trim().toUpperCase();
        if (usns.has(usnUpper)) {
          return res.status(400).json({ error: `Duplicate USN in team: ${validator.escape(usnUpper)}` });
        }
        usns.add(usnUpper);

        sanitizedParticipants.push({
          name: validator.escape(p.name.trim().substring(0, LIMITS.name.max)),
          usn: validator.escape(usnUpper.substring(0, LIMITS.usn.max)),
          branch: p.branch,
          semester: p.semester,
          phone: validator.escape(cleanPhone),
          email: validator.normalizeEmail(p.email) || p.email.trim().toLowerCase(),
        });
      }

      // Check duplicate USN in DB
      const duplicateUSNs = db.usnExists(sanitizedParticipants.map(p => p.usn));
      if (duplicateUSNs.length > 0) {
        return res.status(409).json({
          error: `USN already registered: ${duplicateUSNs.map(u => validator.escape(u)).join(', ')}`
        });
      }

      // Check duplicate team name
      if (db.teamNameExists(trimmedName)) {
        return res.status(409).json({ error: 'A team with this name already exists' });
      }

      // ---- INSERT ----
      const teamId = 'HK-' + uuidv4().split('-')[0].toUpperCase();
      const sanitizedTeamName = validator.escape(trimmedName);

      await db.insertTeam(
        { teamId, teamName: sanitizedTeamName, domain, teamSize },
        sanitizedParticipants
      );

      console.log(`✓ New team registered: ${teamId} — ${sanitizedTeamName} (${domain}, ${teamSize} members)`);

      // ---- GOOGLE SHEETS SYNC (Async, non-blocking) ----
      const timestamp = new Date().toISOString();
      const sheetRows = sanitizedParticipants.map(speaker => [
        sanitizedTeamName,
        teamId,
        domain,
        speaker.name,
        speaker.semester,
        speaker.usn,
        speaker.phone,
        speaker.email,
        timestamp
      ]);
      
      // Fire asynchronously — don't block user response
      appendToGoogleSheet(sheetRows).catch(err => {
        console.error(`⚠ Sheet sync failed for ${teamId}:`, err.message);
      });

      res.status(201).json({
        success: true,
        teamId,
        message: 'Registration successful',
      });

    } catch (err) {
      console.error('Registration error:', err.message);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  });

  return router;
}
