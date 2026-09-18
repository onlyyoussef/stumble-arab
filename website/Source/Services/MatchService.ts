/**
 * MatchService
 * 
 * Centralized service for match and bracket management.
 * Used by both Dashboard API and Discord Bot to ensure consistency.
 */

import { Match, IMatch } from "../Models/Matches";
import { Tournament, ITournament } from "../Models/Tournament";
import { BackboneUser } from "../Models/BackboneUser";
import { TournamentMatchStatus } from "../Backbone/Config";

// ═══════════════════════════════════════════════════════════════════════════
//  TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface MatchInfo {
  matchId: string;
  tournamentId: string;
  phaseId: number;
  groupId: number;
  roundId: number;
  status: number;
  statusLabel: string;
  teams: Array<{
    teamId: string;
    players: Array<{
      userId: string;
      username: string;
    }>;
    score: number;
    isWinner: boolean;
  }>;
  deadline?: Date;
  playedGameCount: number;
}

const MATCH_STATUS_LABELS: Record<number, string> = {
  [-1]: "Unknown",
  0: "Created",
  1: "Waiting for Opponent",
  2: "Ready",
  3: "In Progress",
  4: "Finished",
  5: "Closed",
  8: "Closed"
};

// ═══════════════════════════════════════════════════════════════════════════
//  MATCH QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all matches for a tournament
 */
export async function getTournamentMatches(
  tournamentId: string,
  phaseId?: number,
  roundId?: number
): Promise<MatchInfo[]> {
  const query: any = { tournamentid: tournamentId };
  
  if (phaseId !== undefined) {
    query.phaseid = phaseId;
  }
  
  if (roundId !== undefined) {
    query.roundid = roundId;
  }

  const matches = await Match.find(query)
    .sort({ phaseid: 1, roundid: 1, matchid: 1 })
    .lean();

  return matches.map(match => formatMatchInfo(match));
}

/**
 * Get match by ID
 */
export async function getMatchById(matchId: string): Promise<IMatch | null> {
  return await Match.findOne({ id: matchId });
}

/**
 * Get active matches (not finished/closed)
 */
export async function getActiveMatches(tournamentId?: string): Promise<MatchInfo[]> {
  const query: any = {
    status: { 
      $nin: [TournamentMatchStatus.Closed, TournamentMatchStatus.GameFinished] 
    }
  };
  
  if (tournamentId) {
    query.tournamentid = tournamentId;
  }

  const matches = await Match.find(query)
    .sort({ tournamentid: 1, roundid: 1, matchid: 1 })
    .lean();

  return matches.map(match => formatMatchInfo(match));
}

/**
 * Format match info for consistent output
 */
function formatMatchInfo(match: any): MatchInfo {
  // Group players by team
  const teamsMap = new Map<string, any[]>();
  
  for (const user of match.users || []) {
    const teamId = user["@team-id"] || "unknown";
    if (!teamsMap.has(teamId)) {
      teamsMap.set(teamId, []);
    }
    teamsMap.get(teamId)!.push(user);
  }

  // Build teams array
  const teams = Array.from(teamsMap.entries()).map(([teamId, players]) => {
    const firstPlayer = players[0];
    return {
      teamId,
      players: players.map(p => ({
        userId: p["@user-id"],
        username: p["@username"] || "Unknown"
      })),
      score: parseInt(firstPlayer?.["@team-score"]) || 0,
      isWinner: firstPlayer?.["@match-winner"] === "1"
    };
  });

  return {
    matchId: match.id || match.matchid?.toString() || "unknown",
    tournamentId: match.tournamentid,
    phaseId: match.phaseid,
    groupId: match.groupid,
    roundId: match.roundid,
    status: match.status,
    statusLabel: MATCH_STATUS_LABELS[match.status] || "Unknown",
    teams,
    deadline: match.deadline,
    playedGameCount: match.playedgamecount || 0
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  BRACKET GENERATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get bracket structure for tournament
 */
export async function getTournamentBracket(tournamentId: string): Promise<{
  tournament: ITournament | null;
  phases: Array<{
    phaseId: number;
    phaseType: string;
    rounds: Array<{
      roundId: number;
      matches: MatchInfo[];
    }>;
  }>;
}> {
  const tournament = await Tournament.findOne({ TournamentId: tournamentId });
  
  if (!tournament) {
    return { tournament: null, phases: [] };
  }

  const allMatches = await getTournamentMatches(tournamentId);
  
  // Group by phase
  const phaseMap = new Map<number, MatchInfo[]>();
  for (const match of allMatches) {
    if (!phaseMap.has(match.phaseId)) {
      phaseMap.set(match.phaseId, []);
    }
    phaseMap.get(match.phaseId)!.push(match);
  }

  // Build phases structure
  const phases = [];
  for (const [phaseId, matches] of phaseMap.entries()) {
    // Group by round
    const roundMap = new Map<number, MatchInfo[]>();
    for (const match of matches) {
      if (!roundMap.has(match.roundId)) {
        roundMap.set(match.roundId, []);
      }
      roundMap.get(match.roundId)!.push(match);
    }

    const rounds = Array.from(roundMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([roundId, roundMatches]) => ({
        roundId,
        matches: roundMatches
      }));

    phases.push({
      phaseId,
      phaseType: tournament.Phases[phaseId - 1]?.PhaseType?.toString() || "Unknown",
      rounds
    });
  }

  return { tournament, phases };
}

// ═══════════════════════════════════════════════════════════════════════════
//  MATCH MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update match status
 */
export async function updateMatchStatus(
  matchId: string,
  status: number
): Promise<{ success: boolean; message: string }> {
  const match = await Match.findOne({ id: matchId });
  
  if (!match) {
    return { success: false, message: "Match not found" };
  }

  match.status = status;
  await match.save();

  console.log(`[MatchService] ✅ Match ${matchId} status updated to ${status}`);

  return {
    success: true,
    message: "Match status updated successfully"
  };
}

/**
 * Set match winner
 */
export async function setMatchWinner(
  matchId: string,
  winnerTeamId: string
): Promise<{ success: boolean; message: string }> {
  const match = await Match.findOne({ id: matchId });
  
  if (!match) {
    return { success: false, message: "Match not found" };
  }

  // Update winner flag for all users
  const users = match.users || [];
  for (const user of users) {
    if (user["@team-id"] === winnerTeamId) {
      user["@match-winner"] = "1";
    } else {
      user["@match-winner"] = "0";
    }
  }

  match.users = users;
  match.status = TournamentMatchStatus.GameFinished;
  await match.save();

  console.log(`[MatchService] ✅ Match ${matchId} winner set to team ${winnerTeamId}`);

  return {
    success: true,
    message: "Match winner set successfully"
  };
}

/**
 * Reset match
 */
export async function resetMatch(matchId: string): Promise<{ success: boolean; message: string }> {
  const match = await Match.findOne({ id: matchId });
  
  if (!match) {
    return { success: false, message: "Match not found" };
  }

  // Reset match data
  match.status = TournamentMatchStatus.Created;
  match.playedgamecount = 0;
  
  // Reset winner flags
  const users = match.users || [];
  for (const user of users) {
    user["@match-winner"] = "0";
    user["@team-score"] = "0";
  }
  match.users = users;
  
  await match.save();

  console.log(`[MatchService] ✅ Match ${matchId} reset`);

  return {
    success: true,
    message: "Match reset successfully"
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get match statistics for tournament
 */
export async function getMatchStats(tournamentId: string): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byRound: Record<number, number>;
  completed: number;
  inProgress: number;
  pending: number;
}> {
  const matches = await getTournamentMatches(tournamentId);
  
  const byStatus: Record<string, number> = {};
  const byRound: Record<number, number> = {};
  
  let completed = 0;
  let inProgress = 0;
  let pending = 0;

  for (const match of matches) {
    // By status
    const statusLabel = match.statusLabel;
    byStatus[statusLabel] = (byStatus[statusLabel] || 0) + 1;
    
    // By round
    byRound[match.roundId] = (byRound[match.roundId] || 0) + 1;
    
    // Counts
    if (match.status === TournamentMatchStatus.GameFinished || 
        match.status === TournamentMatchStatus.Closed) {
      completed++;
    } else if (match.status === TournamentMatchStatus.GameInProgress) {
      inProgress++;
    } else {
      pending++;
    }
  }

  return {
    total: matches.length,
    byStatus,
    byRound,
    completed,
    inProgress,
    pending
  };
}
