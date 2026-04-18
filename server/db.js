/**
 * HACKATHON 1.0 — Supabase Database Layer
 * Persistent cloud storage via Supabase
 * 
 * SECURITY: Write operations use service-role key, 
 * all inputs validated before DB calls
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

let supabase = null;

class SupabaseDB {
  constructor(client) {
    this.supabase = client;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    await this._seedAdmin();
    this._initialized = true;
    console.log('✓ Supabase database connected');
  }

  async _seedAdmin() {
    // Check if admin exists
    const { data: admins } = await this.supabase
      .from('admins')
      .select('id')
      .limit(1);

    if (!admins || admins.length === 0) {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        console.error('✗ ADMIN_PASSWORD not set in .env — cannot create admin account');
        console.error('  Add ADMIN_PASSWORD=yourpassword to .env and restart');
        return;
      }
      const hash = bcrypt.hashSync(adminPassword, 12);
      const { error } = await this.supabase
        .from('admins')
        .insert({ username: 'admin', password: hash });

      if (error) {
        console.error('✗ Failed to seed admin:', error.message);
      } else {
        console.log('✓ Default admin account initialized');
      }
    }
  }

  // ---- ADMIN ----
  async getAdmin(username) {
    if (typeof username !== 'string') return null;
    const { data } = await this.supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();
    return data || null;
  }

  // ---- TEAMS ----
  async getAllTeams() {
    const { data: teams, error } = await this.supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('DB getAllTeams error:', error.message);
      return [];
    }

    // Fetch all participants in one query
    const teamIds = teams.map(t => t.team_id);
    const { data: participants } = await this.supabase
      .from('participants')
      .select('*')
      .in('team_id', teamIds);

    // Map participants to teams
    return teams.map(t => ({
      teamId: t.team_id,
      teamName: t.team_name,
      domain: t.domain,
      teamSize: t.team_size,
      createdAt: t.created_at,
      participants: (participants || [])
        .filter(p => p.team_id === t.team_id)
        .map(p => ({
          teamId: p.team_id,
          name: p.name,
          usn: p.usn,
          branch: p.branch,
          semester: p.semester,
          phone: p.phone,
          email: p.email,
        })),
    }));
  }

  async getTeam(teamId) {
    if (typeof teamId !== 'string') return null;

    const { data: team } = await this.supabase
      .from('teams')
      .select('*')
      .eq('team_id', teamId)
      .single();

    if (!team) return null;

    const { data: participants } = await this.supabase
      .from('participants')
      .select('*')
      .eq('team_id', teamId);

    return {
      teamId: team.team_id,
      teamName: team.team_name,
      domain: team.domain,
      teamSize: team.team_size,
      createdAt: team.created_at,
      participants: (participants || []).map(p => ({
        teamId: p.team_id,
        name: p.name,
        usn: p.usn,
        branch: p.branch,
        semester: p.semester,
        phone: p.phone,
        email: p.email,
      })),
    };
  }

  async teamNameExists(teamName) {
    if (typeof teamName !== 'string') return false;
    const { data } = await this.supabase
      .from('teams')
      .select('id')
      .ilike('team_name', teamName.trim())
      .limit(1);
    return data && data.length > 0;
  }

  async usnExists(usnList) {
    if (!Array.isArray(usnList) || usnList.length === 0) return [];
    const upperList = usnList.map(u => u.toUpperCase());
    const { data } = await this.supabase
      .from('participants')
      .select('usn')
      .in('usn', upperList);
    return (data || []).map(p => p.usn);
  }

  async insertTeam(team, participants) {
    // Insert team
    const { error: teamError } = await this.supabase
      .from('teams')
      .insert({
        team_id: team.teamId,
        team_name: team.teamName,
        domain: team.domain,
        team_size: team.teamSize,
      });

    if (teamError) {
      console.error('DB insertTeam error:', teamError.message);
      throw new Error('Failed to save team');
    }

    // Insert participants
    const rows = participants.map(p => ({
      team_id: team.teamId,
      name: p.name,
      usn: p.usn,
      branch: p.branch,
      semester: p.semester,
      phone: p.phone,
      email: p.email,
    }));

    const { error: partError } = await this.supabase
      .from('participants')
      .insert(rows);

    if (partError) {
      console.error('DB insertParticipants error:', partError.message);
      // Rollback team
      await this.supabase.from('teams').delete().eq('team_id', team.teamId);
      throw new Error('Failed to save participants');
    }
  }

  async deleteTeam(teamId) {
    // Participants are deleted via CASCADE in DB schema
    const { error } = await this.supabase
      .from('teams')
      .delete()
      .eq('team_id', teamId);

    if (error) {
      console.error('DB deleteTeam error:', error.message);
      throw new Error('Failed to delete team');
    }
  }

  async getStats() {
    const { count: totalTeams } = await this.supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });

    const { count: totalParticipants } = await this.supabase
      .from('participants')
      .select('*', { count: 'exact', head: true });

    return {
      totalTeams: totalTeams || 0,
      totalParticipants: totalParticipants || 0,
    };
  }
}

export function initDB() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error('✗ FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
    process.exit(1);
  }

  supabase = createClient(url, key);
  const db = new SupabaseDB(supabase);

  // Initialize asynchronously (seed admin, etc.)
  db.init().catch(err => {
    console.error('✗ Database initialization failed:', err.message);
  });

  return db;
}
