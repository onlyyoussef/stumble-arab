/**
 * TournamentService
 * 
 * Centralized service for all tournament-related operations.
 * Used by both Dashboard API and Discord Bot to ensure consistency.
 */

import { Tournament, ITournament, TournamentInput } from "../Models/Tournament";
import { BackboneUser } from "../Models/BackboneUser";
import { Match } from "../Models/Matches";
import { TournamentPhaseType, TournamentStatus } from "../Backbone/Config";
import { GeneratePrizepoolId, GenerateInviteId } from "../Modules/Extensions";

// ═══════════════════════════════════════════════════════════════════════════
//  TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export interface TeamSizeConfig {
  teamSize: number;           // Players per team (1, 2, 3, or 4)
  teamsPerMatch: number;      // Always 2 (Team A vs Team B)
  playersPerMatch: number;    // Total players in one match (teamSize × 2)
  maxTeamsInTournament: number; // Total teams that can participate
}

export interface TournamentCreationParams {
  name: string;
  teamSize: number;           // 1, 2, 3, or 4
  region: string;
  map: string;
  maxParticipants: number;
  rounds: number;
  scheduledFor?: Date;
  entryFee?: number;
  prizes?: Array<{ position: number; amount: number }>;
  image?: string;
  color?: string;
  streamURL?: string;
  disabledEmotes?: number[];
  invitedIds?: string[];
  adminIds?: string[];
  isPrivate?: boolean;
  tournamentType?: number;
  phaseType?: number;
}

export interface TournamentValidationResult {
  valid: boolean;
  error?: string;
  config?: TeamSizeConfig;
}

// ═══════════════════════════════════════════════════════════════════════════
//  VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates and calculates team size configuration
 * 
 * CRITICAL: This ensures correct XvX format:
 * - 1v1: 1 player per team × 2 teams = 2 players per match
 * - 2v2: 2 players per team × 2 teams = 4 players per match
 * - 3v3: 3 players per team × 2 teams = 6 players per match
 * - 4v4: 4 players per team × 2 teams = 8 players per match
 */
export function validateTeamSize(teamSize: number, maxParticipants: number): TournamentValidationResult {
  // Validate team size is supported
  if (![1, 2, 3, 4].includes(teamSize)) {
    return {
      valid: false,
      error: "Invalid team size. Must be 1, 2, 3, or 4"
    };
  }

  // Calculate configuration
  const teamsPerMatch = 2; // Always 2 teams per match (Team A vs Team B)
  const playersPerMatch = teamSize * teamsPerMatch;
  const maxTeamsInTournament = Math.floor(maxParticipants / teamSize);

  // Validate minimum teams
  if (maxTeamsInTournament < 2) {
    return {
      valid: false,
      error: `Not enough player slots for ${teamSize}v${teamSize}. Need at least ${teamSize * 2} players (2 teams).`
    };
  }

  // Validate max participants is divisible by team size
  if (maxParticipants % teamSize !== 0) {
    const suggestedMax = maxTeamsInTournament * teamSize;
    return {
      valid: false,
      error: `Max players (${maxParticipants}) is not divisible by team size (${teamSize}). Suggested: ${suggestedMax} players for ${maxTeamsInTournament} teams.`
    };
  }

  // Validate bracket size (should be power of 2 or close)
  // For competitive integrity, we want bracket sizes that work well
  const validBracketSizes = [2, 4, 8, 16, 32, 64, 128, 256];
  const isValidBracketSize = validBracketSizes.includes(maxTeamsInTournament);
  
  if (!isValidBracketSize) {
    // Find closest valid bracket size
    const closest = validBracketSizes.reduce((prev, curr) => 
      Math.abs(curr - maxTeamsInTournament) < Math.abs(prev - maxTeamsInTournament) ? curr : prev
    );
    const suggestedMax = closest * teamSize;
    
    return {
      valid: false,
      error: `Max teams (${maxTeamsInTournament}) should be a power of 2 for optimal bracket generation. Suggested: ${suggestedMax} players for ${closest} teams.`
    };
  }

  return {
    valid: true,
    config: {
      teamSize,
      teamsPerMatch,
      playersPerMatch,
      maxTeamsInTournament
    }
  };
}

/**
 * Validates tournament name
 */
export function validateTournamentName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: "Tournament name is required" };
  }

  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: "Tournament name must be at least 3 characters" };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: "Tournament name must be less than 100 characters" };
  }

  // Check for invalid characters
  const validPattern = /^[a-zA-Z0-9\s\-_!@#$%&*()+=[\]{}|;:'",.<>?/]+$/;
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: "Tournament name contains invalid characters" };
  }

  return { valid: true };
}

/**
 * Validates region
 */
export function validateRegion(region: string): { valid: boolean; error?: string } {
  const validRegions = ['0', '1', '2', '3', '4']; // EU, NA, SA, Asia, Oceania
  if (!validRegions.includes(region.toString())) {
    return { valid: false, error: "Invalid region. Must be 0-4 (EU, NA, SA, Asia, Oceania)" };
  }
  return { valid: true };
}

/**
 * Validates rounds
 */
export function validateRounds(rounds: number, maxTeams: number): { valid: boolean; error?: string; adjustedRounds?: number } {
  if (rounds < 1) {
    return { valid: false, error: "Rounds must be at least 1" };
  }

  if (rounds > 10) {
    return { valid: true, adjustedRounds: 10 };
  }

  const requiredRounds = Math.ceil(Math.log2(maxTeams));
  if (rounds < requiredRounds) {
    return { valid: true, adjustedRounds: requiredRounds };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════
//  TOURNAMENT CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a new tournament with proper validation
 */
export async function createTournament(params: TournamentCreationParams): Promise<ITournament> {
  // Validate name
  const nameValidation = validateTournamentName(params.name);
  if (!nameValidation.valid) {
    throw new Error(nameValidation.error);
  }

  // Validate team size
  const teamValidation = validateTeamSize(params.teamSize, params.maxParticipants);
  if (!teamValidation.valid) {
    throw new Error(teamValidation.error!);
  }

  const config = teamValidation.config!;

  // Validate region
  const regionValidation = validateRegion(params.region);
  if (!regionValidation.valid) {
    throw new Error(regionValidation.error);
  }

  // Validate rounds
  const roundsValidation = validateRounds(params.rounds, config.maxTeamsInTournament);
  if (!roundsValidation.valid) {
    throw new Error(roundsValidation.error);
  }

  const finalRounds = roundsValidation.adjustedRounds || params.rounds;

  // Calculate times
  const startTime = params.scheduledFor || new Date(Date.now() + 60 * 60 * 1000);
  const signupStart = new Date(startTime.getTime() - 60 * 60 * 1000);

  // Generate IDs
  const tournamentId = GenerateInviteId().toString();
  const prizepoolId = GeneratePrizepoolId().toString();

  // Log configuration
  console.log(`[TournamentService] Creating ${config.teamSize}v${config.teamSize} tournament:`, {
    name: params.name,
    teamSize: config.teamSize,
    playersPerMatch: config.playersPerMatch,
    maxTeamsInTournament: config.maxTeamsInTournament,
    maxParticipants: params.maxParticipants,
    rounds: finalRounds
  });

  // Build tournament data
  const tournamentData: TournamentInput = {
    CurrentInvites: 0,
    MaxInvites: params.maxParticipants,
    MinPlayersPerMatch: config.playersPerMatch,
    MaxPlayersPerMatch: config.playersPerMatch,
    TournamentId: tournamentId,
    TournamentName: params.name.trim(),
    TournamentImage: params.image || "",
    TournamentColor: params.color || "#667eea",
    StartTime: startTime,
    SignupStart: signupStart,
    EntryFee: params.entryFee || 0,
    PrizepoolId: prizepoolId,
    PartySize: config.teamSize,
    Status: params.scheduledFor ? TournamentStatus.NotStarted : TournamentStatus.InvitationOpen,
    TournamentType: params.tournamentType || 0,
    Phases: [{
      PhaseType: params.phaseType || TournamentPhaseType.SingleEliminationBracket,
      Maps: [params.map],
      IsPhase: true,
      GroupCount: 1,
      RoundCount: finalRounds,
      MaxTeams: config.maxTeamsInTournament,
    }],
    Region: params.region,
    RoundCount: finalRounds,
    Prizes: params.prizes || [],
    Winners: [],
    CurrentPhaseId: 0,
    Properties: {
      IsInvitationOnly: params.isPrivate || false,
      InvitedIds: params.invitedIds || [],
      DisabledEmotes: params.disabledEmotes || [],
      AdminIds: params.adminIds || [],
      StreamURL: params.streamURL || "",
    },
  };

  // Create tournament in database
  const tournament = new Tournament(tournamentData);
  const saved = await tournament.save();

  console.log(`[TournamentService] ✅ Tournament created: ${tournamentId} (${params.name})`);

  // Send webhook notification (async, don't wait)
  sendTournamentWebhook(saved).catch(err => 
    console.error(`[TournamentService] Webhook error for ${tournamentId}:`, err)
  );

  return saved;
}

/**
 * Sends webhook notification for tournament (imported from Database.ts logic)
 */
async function sendTournamentWebhook(tournament: ITournament): Promise<void> {
  // Send webhook using Database handler
  try {
    const Database = await import("../Handlers/Database");
    // Check if SendWebhook exists (it might not be exported)
    // For now, skip webhook to avoid circular dependency
    console.log(`[TournamentService] Webhook notification skipped for ${tournament.TournamentId}`);
  } catch (error) {
    console.error("[TournamentService] Failed to send webhook:", error);
  }
}

/**
 * Get tournament by ID
 */
export async function getTournamentById(tournamentId: string): Promise<any | null> {
  return await Tournament.findOne({ TournamentId: tournamentId }).lean();
}

/**
 * Get all tournaments with optional filters
 */
export async function getTournaments(filters?: {
  status?: number;
  region?: string;
  search?: string;
  limit?: number;
  skip?: number;
}): Promise<any[]> {
  const query: any = {};

  if (filters?.status !== undefined) {
    query.Status = filters.status;
  }

  if (filters?.region) {
    query.Region = filters.region;
  }

  if (filters?.search) {
    query.TournamentName = { $regex: filters.search, $options: 'i' };
  }

  return await Tournament.find(query)
    .sort({ StartTime: -1 })
    .limit(filters?.limit || 100)
    .skip(filters?.skip || 0)
    .lean();
}

/**
 * Update tournament
 */
export async function updateTournament(
  tournamentId: string,
  updates: Partial<ITournament>
): Promise<ITournament | null> {
  const tournament = await Tournament.findOne({ TournamentId: tournamentId });
  
  if (!tournament) {
    throw new Error("Tournament not found");
  }

  // Apply updates
  Object.assign(tournament, updates);
  
  const saved = await tournament.save();
  console.log(`[TournamentService] ✅ Tournament updated: ${tournamentId}`);
  
  return saved;
}

/**
 * Delete tournament
 */
export async function deleteTournament(tournamentId: string): Promise<boolean> {
  const result = await Tournament.deleteOne({ TournamentId: tournamentId });
  
  if (result.deletedCount > 0) {
    console.log(`[TournamentService] ✅ Tournament deleted: ${tournamentId}`);
    return true;
  }
  
  return false;
}

/**
 * Get tournament statistics
 */
export async function getTournamentStats() {
  const [total, active, scheduled, completed, totalPlayers] = await Promise.all([
    Tournament.countDocuments(),
    Tournament.countDocuments({ Status: TournamentStatus.InvitationOpen }),
    Tournament.countDocuments({ Status: TournamentStatus.NotStarted }),
    Tournament.countDocuments({ Status: TournamentStatus.Finished }),
    BackboneUser.countDocuments()
  ]);

  return {
    total,
    active,
    scheduled,
    completed,
    totalPlayers
  };
}

/**
 * Get players for a tournament
 */
export async function getTournamentPlayers(tournamentId: string) {
  const players = await BackboneUser.find({
    [`Tournaments.${tournamentId}.SignedUp`]: true
  }).lean();

  return players.map(p => {
    const tournamentData = (p.Tournaments as any)[tournamentId];
    return {
      userId: p.UserId,
      username: p.Username,
      signedUp: tournamentData?.SignedUp,
      status: tournamentData?.Status,
      partyCode: tournamentData?.PartyCode,
      partyMembers: tournamentData?.PartyMembers || [],
      finalPlace: tournamentData?.FinalPlace || 0,
      isPartyLeader: tournamentData?.PartyMembers?.find((m: any) => m.UserId === p.UserId)?.IsPartyLeader || false
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get human-readable mode label (1v1, 2v2, etc.)
 */
export function getModeLabel(teamSize: number): string {
  const modeMap: Record<number, string> = { 1: "1v1", 2: "2v2", 3: "3v3", 4: "4v4" };
  return modeMap[teamSize] || `${teamSize}v${teamSize}`;
}

/**
 * Calculate current tournament status based on times
 */
export function calculateTournamentStatus(tournament: ITournament): number {
  const now = new Date();
  const opens = new Date(tournament.SignupStart);
  const starts = new Date(tournament.StartTime);
  const closes = new Date(starts.getTime() - 75 * 1000);

  // If already finished or cancelled, keep that status
  if (
    tournament.Status === TournamentStatus.Canceled ||
    tournament.Status === TournamentStatus.Finished
  ) {
    return tournament.Status;
  }

  // Calculate based on time
  if (now < opens) return TournamentStatus.NotStarted;
  if (now <= closes) return TournamentStatus.InvitationOpen;
  if (now < starts) return TournamentStatus.InvitationClose;
  return TournamentStatus.Running;
}
