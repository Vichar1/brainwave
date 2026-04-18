/**
 * HACKATHON 1.0 — JSON File Database
 * Zero-dependency, zero-compilation, fully atomic
 * 
 * SECURITY: Write mutex prevents race conditions
 */

import { readFileSync, writeFileSync, existsSync, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'hackathon.db.json');

// Default database structure
const DEFAULT_DB = {
  teams: [],
  participants: [],
  admins: [],
};

class JsonDB {
  constructor(filePath) {
    this.filePath = filePath;
    this._writeLock = false;
    this._writeQueue = [];
    this.data = this._load();
    this._seedAdmin();
  }

  _load() {
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        // Validate structure
        if (!data.teams || !data.participants || !data.admins) {
          console.warn('⚠ DB structure invalid, merging with defaults');
          return { ...JSON.parse(JSON.stringify(DEFAULT_DB)), ...data };
        }
        return data;
      }
    } catch (err) {
      console.error('DB load error, creating fresh DB:', err.message);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }

  /**
   * Atomic write with temp file + rename pattern.
   * Prevents data corruption if process crashes mid-write.
   */
  _save() {
    try {
      const tempPath = this.filePath + '.tmp';
      writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error('DB save error:', err.message);
      throw new Error('Database write failed');
    }
  }

  /**
   * Serialized write access — prevents race conditions from concurrent requests.
   * Wraps a mutation callback in a queue to prevent overlapping writes.
   */
  withWriteLock(fn) {
    return new Promise((resolve, reject) => {
      const execute = () => {
        this._writeLock = true;
        try {
          const result = fn();
          this._save();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this._writeLock = false;
          // Process next queued write
          if (this._writeQueue.length > 0) {
            const next = this._writeQueue.shift();
            next();
          }
        }
      };

      if (this._writeLock) {
        this._writeQueue.push(execute);
      } else {
        execute();
      }
    });
  }

  _seedAdmin() {
    if (this.data.admins.length === 0) {
      // SECURITY: Admin password from env, or generate a random one
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        console.error('✗ ADMIN_PASSWORD not set in .env — cannot create admin account');
        console.error('  Add ADMIN_PASSWORD=yourpassword to .env and restart');
        return;
      }
      const hash = bcrypt.hashSync(adminPassword, 12);
      this.data.admins.push({
        id: 1,
        username: 'admin',
        password: hash,
        createdAt: new Date().toISOString(),
      });
      this._save();
      // SECURITY: Never log the actual password
      console.log('✓ Default admin account initialized');
    }
  }

  // ---- ADMIN ----
  getAdmin(username) {
    if (typeof username !== 'string') return null;
    return this.data.admins.find(a => a.username === username) || null;
  }

  // ---- TEAMS ----
  getAllTeams() {
    return this.data.teams.map(t => ({
      ...t,
      participants: this.data.participants.filter(p => p.teamId === t.teamId),
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getTeam(teamId) {
    if (typeof teamId !== 'string') return null;
    const team = this.data.teams.find(t => t.teamId === teamId);
    if (!team) return null;
    return {
      ...team,
      participants: this.data.participants.filter(p => p.teamId === teamId),
    };
  }

  teamNameExists(teamName) {
    if (typeof teamName !== 'string') return false;
    return this.data.teams.some(t => t.teamName.toLowerCase() === teamName.toLowerCase());
  }

  usnExists(usnList) {
    if (!Array.isArray(usnList)) return [];
    const allUSNs = this.data.participants.map(p => p.usn.toUpperCase());
    return usnList.filter(usn => allUSNs.includes(usn.toUpperCase()));
  }

  async insertTeam(team, participants) {
    return this.withWriteLock(() => {
      this.data.teams.push({
        teamId: team.teamId,
        teamName: team.teamName,
        domain: team.domain,
        teamSize: team.teamSize,
        createdAt: new Date().toISOString(),
      });

      participants.forEach(p => {
        this.data.participants.push({
          teamId: team.teamId,
          name: p.name,
          usn: p.usn,
          branch: p.branch,
          semester: p.semester,
          phone: p.phone,
          email: p.email,
        });
      });
    });
  }

  async deleteTeam(teamId) {
    return this.withWriteLock(() => {
      this.data.teams = this.data.teams.filter(t => t.teamId !== teamId);
      this.data.participants = this.data.participants.filter(p => p.teamId !== teamId);
    });
  }

  getStats() {
    return {
      totalTeams: this.data.teams.length,
      totalParticipants: this.data.participants.length,
    };
  }
}

export function initDB() {
  return new JsonDB(DB_PATH);
}
