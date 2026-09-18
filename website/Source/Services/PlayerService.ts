/**
 * PlayerService
 * 
 * Centralized service for player and team management operations.
 * Used by both Dashboard API and Discord Bot to ensure consistency.
 */

import { BackboneUser, IBackboneUser } from "../Models/BackboneUser";
import { Tournament } from "../Models/Tournament";
import { v4 as uuidv4 } from "uuid";

// ═══════════════════════════════════════════════════════════════════════════
//  TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface PlayerInfo {
  userId: string;
  username: string;
  signedUp: boolean;
  status: number;
  partyCode?: string;
  partyMembers: Array<{
    UserId: string;
    Username: string;
    Status: number;
    IsPartyLeader: boolean;
  }>;
  finalPlace: number;
  isPartyLeader: boolean;
  acceptedAt?: Date;
  knockedOut: boolean;
}

export interface TeamInfo {
  teamId: string;
  partyCode: string;
  members: PlayerInfo[];
  leaderUserId: string;
  leaderUsername: string;
  teamSize: number;
  isFull: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
//  PLAYER QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all players signed up for a tournament
 */
export async function getTournamentPlayers(tournamentId: string): Promise<PlayerInfo[]> {
  const players = await BackboneUser.find({
    [`Tournaments.${tournamentId}.SignedUp`]: true
  }).lean();

  return players.map(player => formatPlayerInfo(player, tournamentId));
}

/**
 * Get player by userId
 */
export async function getPlayerById(userId: string): Promise<IBackboneUser | null> {
  return await BackboneUser.findOne({ UserId: userId });
}

/**
 * Get player by username (case-insensitive)
 */
export async function getPlayerByUsername(username: string): Promise<IBackboneUser | null> {
  return await BackboneUser.findOne({ 
    Username: { $regex: new RegExp(`^${username}$`, 'i') } 
  });
}

/**
 * Search player by username or userId
 */
export async function findPlayer(searchTerm: string): Promise<IBackboneUser | null> {
  // Try by userId first
  let player = await getPlayerById(searchTerm);
  
  // If not found, try by username
  if (!player) {
    player = await getPlayerByUsername(searchTerm);
  }
  
  return player;
}

/**
 * Get player count for tournament
 */
export async function getPlayerCount(tournamentId: string): Promise<number> {
  return await BackboneUser.countDocuments({
    [`Tournaments.${tournamentId}.SignedUp`]: true
  });
}

/**
 * Format player info for consistent output
 */
function formatPlayerInfo(player: any, tournamentId: string): PlayerInfo {
  const tournamentData = player.Tournaments?.[tournamentId] || {};
  const partyMembers = tournamentData.PartyMembers || [];
  const currentMember = partyMembers.find((m: any) => m.UserId === player.UserId);

  return {
    userId: player.UserId,
    username: player.Username,
    signedUp: tournamentData.SignedUp || false,
    status: tournamentData.Status || 0,
    partyCode: tournamentData.PartyCode,
    partyMembers: partyMembers,
    finalPlace: tournamentData.FinalPlace || 0,
    isPartyLeader: currentMember?.IsPartyLeader || false,
    acceptedAt: tournamentData.AcceptedAt,
    knockedOut: tournamentData.KnockedOut || false
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  TEAM QUERIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all teams in a tournament
 */
export async function getTournamentTeams(tournamentId: string): Promise<TeamInfo[]> {
  const players = await getTournamentPlayers(tournamentId);
  
  // Group players by partyCode
  const teamsMap = new Map<string, PlayerInfo[]>();
  
  for (const player of players) {
    if (player.partyCode) {
      if (!teamsMap.has(player.partyCode)) {
        teamsMap.set(player.partyCode, []);
      }
      teamsMap.get(player.partyCode)!.push(player);
    }
  }
  
  // Convert to TeamInfo array
  const teams: TeamInfo[] = [];
  let teamNumber = 1;
  
  for (const [partyCode, members] of teamsMap.entries()) {
    const leader = members.find(m => m.isPartyLeader);
    const tournament = await Tournament.findOne({ TournamentId: tournamentId });
    const expectedTeamSize = tournament?.PartySize || 1;
    
    teams.push({
      teamId: `team_${teamNumber}`,
      partyCode,
      members,
      leaderUserId: leader?.userId || members[0].userId,
      leaderUsername: leader?.username || members[0].username,
      teamSize: members.length,
      isFull: members.length >= expectedTeamSize
    });
    
    teamNumber++;
  }
  
  return teams;
}

/**
 * Get team by partyCode
 */
export async function getTeamByPartyCode(
  tournamentId: string, 
  partyCode: string
): Promise<TeamInfo | null> {
  const teams = await getTournamentTeams(tournamentId);
  return teams.find(t => t.partyCode === partyCode) || null;
}

/**
 * Get player's team
 */
export async function getPlayerTeam(
  tournamentId: string, 
  userId: string
): Promise<TeamInfo | null> {
  const player = await getPlayerById(userId);
  if (!player) return null;
  
  const tournamentData = (player.Tournaments as any)?.[tournamentId];
  if (!tournamentData?.PartyCode) return null;
  
  return await getTeamByPartyCode(tournamentId, tournamentData.PartyCode);
}

// ═══════════════════════════════════════════════════════════════════════════
//  PLAYER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add player to tournament (force signup)
 */
export async function addPlayerToTournament(
  tournamentId: string,
  userId: string,
  username: string
): Promise<{ success: boolean; message: string; player?: IBackboneUser }> {
  // Get tournament
  const tournament = await Tournament.findOne({ TournamentId: tournamentId });
  if (!tournament) {
    return { success: false, message: "Tournament not found" };
  }

  // Check if tournament is full
  if (tournament.CurrentInvites >= tournament.MaxInvites) {
    return { success: false, message: "Tournament is full" };
  }

  // Find or create player
  let player = await BackboneUser.findOne({ UserId: userId });
  
  if (!player) {
    player = new BackboneUser({
      UserId: userId,
      Username: username,
      Tournaments: {}
    });
  }

  // Check if already signed up
  const playerTournaments = player.Tournaments as any;
  if (playerTournaments[tournamentId]?.SignedUp) {
    return { success: false, message: "Player already signed up" };
  }

  // Create party code for team tournaments
  const partySize = tournament.PartySize;
  const partyCode = uuidv4();
  const partyMembers = [{
    UserId: userId,
    Username: username,
    Status: 1,
    IsPartyLeader: true
  }];

  // Add tournament data to player
  playerTournaments[tournamentId] = {
    SignedUp: true,
    InviteId: Math.random().toString(36).substring(2, 10),
    Status: 1,
    AcceptedAt: new Date(),
    PartyCode: partyCode,
    KnockedOut: false,
    PartyMembers: partyMembers,
    UserMatch: null,
    UserMatches: [],
    UserPosition: [],
    FinalPlace: 0
  };

  player.Tournaments = playerTournaments;
  await player.save();

  // Update tournament player count
  tournament.CurrentInvites += 1;
  await tournament.save();

  console.log(`[PlayerService] ✅ Player ${username} (${userId}) added to tournament ${tournamentId}`);

  return {
    success: true,
    message: "Player added successfully",
    player
  };
}

/**
 * Remove player from tournament (kick)
 */
export async function removePlayerFromTournament(
  tournamentId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const player = await BackboneUser.findOne({ UserId: userId });
  if (!player) {
    return { success: false, message: "Player not found" };
  }

  const playerTournaments = player.Tournaments as any;
  if (!playerTournaments[tournamentId]?.SignedUp) {
    return { success: false, message: "Player not signed up for this tournament" };
  }

  // Remove from tournament
  delete playerTournaments[tournamentId];
  player.Tournaments = playerTournaments;
  await player.save();

  // Update tournament player count
  const tournament = await Tournament.findOne({ TournamentId: tournamentId });
  if (tournament && tournament.CurrentInvites > 0) {
    tournament.CurrentInvites -= 1;
    await tournament.save();
  }

  console.log(`[PlayerService] ✅ Player ${userId} removed from tournament ${tournamentId}`);

  return {
    success: true,
    message: "Player removed successfully"
  };
}

/**
 * Reset player data in tournament
 */
export async function resetPlayerInTournament(
  tournamentId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const player = await BackboneUser.findOne({ UserId: userId });
  if (!player) {
    return { success: false, message: "Player not found" };
  }

  const playerTournaments = player.Tournaments as any;
  const tournamentData = playerTournaments[tournamentId];
  
  if (!tournamentData) {
    return { success: false, message: "Player not in this tournament" };
  }

  // Reset relevant fields but keep signup
  tournamentData.Status = 1;
  tournamentData.KnockedOut = false;
  tournamentData.UserMatch = null;
  tournamentData.UserMatches = [];
  tournamentData.UserPosition = [];
  tournamentData.FinalPlace = 0;

  player.Tournaments = playerTournaments;
  await player.save();

  console.log(`[PlayerService] ✅ Player ${userId} reset in tournament ${tournamentId}`);

  return {
    success: true,
    message: "Player data reset successfully"
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PLAYER STATISTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get player tournament history and stats
 */
export async function getPlayerStats(userId: string): Promise<{
  player: IBackboneUser | null;
  totalTournaments: number;
  wins: number;
  topThree: number;
  tournaments: Array<{
    tournamentId: string;
    tournamentName: string;
    finalPlace: number;
    status: number;
    knockedOut: boolean;
  }>;
}> {
  const player = await BackboneUser.findOne({ UserId: userId });
  
  if (!player) {
    return {
      player: null,
      totalTournaments: 0,
      wins: 0,
      topThree: 0,
      tournaments: []
    };
  }

  const playerTournaments = player.Tournaments as any;
  const tournamentIds = Object.keys(playerTournaments);
  
  let wins = 0;
  let topThree = 0;
  const tournaments = [];

  for (const tournamentId of tournamentIds) {
    const data = playerTournaments[tournamentId];
    const tournament = await Tournament.findOne({ TournamentId: tournamentId });
    
    const finalPlace = data.FinalPlace || 0;
    if (finalPlace === 1) wins++;
    if (finalPlace > 0 && finalPlace <= 3) topThree++;

    tournaments.push({
      tournamentId,
      tournamentName: tournament?.TournamentName || "Unknown",
      finalPlace,
      status: data.Status || 0,
      knockedOut: data.KnockedOut || false
    });
  }

  return {
    player,
    totalTournaments: tournamentIds.length,
    wins,
    topThree,
    tournaments
  };
}

/**
 * Get top players leaderboard
 */
export async function getTopPlayers(limit: number = 10): Promise<Array<{
  userId: string;
  username: string;
  tournaments: number;
  wins: number;
  topThree: number;
}>> {
  const allPlayers = await BackboneUser.find().lean();
  
  const playerStats = allPlayers.map(player => {
    const tournaments = player.Tournaments as any;
    const tournamentIds = Object.keys(tournaments);
    
    let wins = 0;
    let topThree = 0;
    
    for (const tournamentId of tournamentIds) {
      const finalPlace = tournaments[tournamentId].FinalPlace || 0;
      if (finalPlace === 1) wins++;
      if (finalPlace > 0 && finalPlace <= 3) topThree++;
    }
    
    return {
      userId: player.UserId,
      username: player.Username,
      tournaments: tournamentIds.length,
      wins,
      topThree
    };
  });

  // Sort by wins, then topThree, then tournaments
  playerStats.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.topThree !== a.topThree) return b.topThree - a.topThree;
    return b.tournaments - a.tournaments;
  });

  return playerStats.slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate unique user ID
 */
export async function generateUserId(): Promise<string> {
  let unique = false;
  let userId = "";

  while (!unique) {
    userId = Math.floor(10000 + Math.random() * 90000).toString();
    const exists = await BackboneUser.findOne({ UserId: userId });
    if (!exists) unique = true;
  }

  return userId;
}
