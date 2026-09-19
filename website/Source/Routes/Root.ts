import { Router } from "express";
import { ForService, ServiceType } from "../Modules/Service";
import path from "path";
import crypto from "crypto";
import type { TournamentCreationParams } from "../Services/TournamentService";

const App = Router();

App.use(ForService(ServiceType.Public));

// ============= HELPER: Get user from session token =============

async function getUserFromToken(req: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;

  const { Session } = await import("../Models/Session");
  const { User } = await import("../Models/User");

  const session = await Session.findOne({ token, expiresAt: { $gt: new Date() } });
  if (!session) return null;

  const user = await User.findById(session.userId);
  return user || null;
}

// ============= USERNAME/PASSWORD AUTHENTICATION =============

App.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ success: false, message: "Username must be 3-30 characters" });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters" });
    }

    const { User } = await import("../Models/User");

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Username already taken" });
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const user = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      email: email || undefined,
      credits: 0,
      role: "user",
      tournamentsCreated: 0
    });

    console.log(`New user registered: ${username}`);

    res.json({ success: true, message: "Account created! Please login." });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

App.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }

    const { User } = await import("../Models/User");
    const { Session } = await import("../Models/Session");

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    if (user.password !== hashedPassword) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Session.create({
      userId: user._id.toString(),
      token,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent")
    });

    user.lastLogin = new Date();
    await user.save();

    console.log(`User logged in: ${username}`);

    res.json({
      success: true,
      token,
      user: {
        userId: user._id.toString(),
        username: user.username,
        credits: user.credits,
        role: user.role,
        tournamentsCreated: user.tournamentsCreated
      }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

App.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    res.json({
      success: true,
      user: {
        userId: user._id.toString(),
        username: user.username,
        credits: user.credits,
        role: user.role,
        tournamentsCreated: user.tournamentsCreated
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Auth check failed" });
  }
});

// ============= PAGES =============

App.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "../../public/login.html"));
});

App.get("/dashboard.html", (_, res) => {
  res.sendFile(path.join(__dirname, "../../public/dashboard.html"));
});

App.get("/login.html", (_, res) => {
  res.sendFile(path.join(__dirname, "../../public/login.html"));
});

App.get("/admin.html", (_, res) => {
  res.sendFile(path.join(__dirname, "../../public/admin.html"));
});

// ============= CREDITS MANAGEMENT =============

App.post("/api/credits/add", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { User } = await import("../Models/User");
    const { username, amount } = req.body;

    if (!username || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "username and positive amount required" });
    }

    const target = await User.findOne({ username: username.toLowerCase() });
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    target.credits += parseInt(amount);
    await target.save();

    console.log(`Admin ${user.username} added ${amount} credits to ${target.username}`);

    res.json({
      success: true,
      message: `Added ${amount} credits to ${target.username}`,
      user: {
        username: target.username,
        credits: target.credits
      }
    });
  } catch (error: any) {
    console.error("Error adding credits:", error);
    res.status(500).json({ success: false, message: "Failed to add credits" });
  }
});

App.post("/api/credits/set", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { User } = await import("../Models/User");
    const { username, amount } = req.body;

    if (!username || amount === undefined) {
      return res.status(400).json({ success: false, message: "username and amount required" });
    }

    const target = await User.findOne({ username: username.toLowerCase() });
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    target.credits = Math.max(0, parseInt(amount));
    await target.save();

    console.log(`Admin ${user.username} set ${target.username} credits to ${target.credits}`);

    res.json({
      success: true,
      message: `Set ${target.username} credits to ${target.credits}`,
      user: {
        username: target.username,
        credits: target.credits
      }
    });
  } catch (error: any) {
    console.error("Error setting credits:", error);
    res.status(500).json({ success: false, message: "Failed to set credits" });
  }
});

App.get("/api/users/list", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const { User } = await import("../Models/User");
    const users = await User.find()
      .sort({ credits: -1 })
      .select("username credits role tournamentsCreated createdAt lastLogin")
      .lean();

    res.json({
      success: true,
      users
    });
  } catch (error: any) {
    console.error("Error listing users:", error);
    res.status(500).json({ success: false, message: "Failed to list users" });
  }
});

// ============= TOURNAMENT ENDPOINTS =============

App.get("/api/tournaments", async (req, res) => {
  try {
    const { Tournament } = await import("../Models/Tournament");
    const tournaments = await Tournament.find()
      .sort({ StartTime: -1 })
      .limit(100)
      .lean();
    res.json(tournaments);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
});

App.get("/api/tournaments/:id", async (req, res) => {
  try {
    const { Tournament } = await import("../Models/Tournament");
    const tournament = await Tournament.findOne({ TournamentId: req.params.id }).lean();

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    res.json(tournament);
  } catch (error) {
    console.error("Error fetching tournament:", error);
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
});

App.post("/api/tournaments/create", async (req, res) => {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const { createTournament } = await import("../Services/TournamentService");

    if (user.credits < 1) {
      return res.status(403).json({
        success: false,
        message: "Insufficient credits. You need at least 1 credit to create a tournament.",
        credits: user.credits
      });
    }

    const {
      name,
      mode,
      region,
      maxParticipants,
      description,
      map,
      roundCount,
      scheduledFor,
    } = req.body;

    if (!name || mode === undefined || region === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, mode, region"
      });
    }

    const teamSize = parseInt(mode);

    const params = {
      name: name,
      teamSize: teamSize,
      region: region.toString(),
      map: map || "BlockDash",
      maxParticipants: parseInt(maxParticipants) || 32,
      rounds: parseInt(roundCount) || 3,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      adminIds: [user._id.toString()]
    };

    const tournament = await createTournament(params);

    fetch("https://discord.com/api/webhooks/1537471955698057328/YSlHcJb6kc_aralIItkhL0-b4_x2j2pTO-hLY0tb2ZSCwY_Uck3WVF3Uk5Jc9T25S6V8", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "🏆 Tournament Created",
          description: tournament.TournamentName,
          color: 0x667eea,
          fields: [
            { name: "Mode", value: `${params.teamSize}v${params.teamSize}`, inline: true },
            { name: "Region", value: params.region, inline: true },
            { name: "Map", value: params.map || "BlockDash", inline: true },
            { name: "Max Participants", value: `${params.maxParticipants}`, inline: true },
            { name: "Created by", value: user.username, inline: true },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    }).catch((err) => console.error("Discord webhook error:", err));

    user.credits -= 1;
    user.tournamentsCreated += 1;
    await user.save();

    console.log(`Tournament created by ${user.username}. Credits remaining: ${user.credits}`);

    res.json({
      success: true,
      message: "Tournament created successfully! 1 credit deducted.",
      tournament: tournament,
      remainingCredits: user.credits
    });
  } catch (error: any) {
    console.error("Error creating tournament:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create tournament"
    });
  }
});

App.delete("/api/tournaments/:id", async (req, res) => {
  try {
    const { Tournament } = await import("../Models/Tournament");
    const tournament = await Tournament.findOneAndDelete({ TournamentId: req.params.id });

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    res.json({
      success: true,
      message: "Tournament cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling tournament:", error);
    res.status(500).json({ message: "Failed to cancel tournament" });
  }
});

App.get("/api/stats", async (req, res) => {
  try {
    const { Tournament } = await import("../Models/Tournament");
    const { BackboneUser } = await import("../Models/BackboneUser");

    const total = await Tournament.countDocuments();
    const active = await Tournament.countDocuments({ Status: 1 });
    const scheduled = await Tournament.countDocuments({ Status: 0 });
    const completed = await Tournament.countDocuments({ Status: 2 });
    const totalPlayers = await BackboneUser.countDocuments();

    res.json({
      total,
      active,
      scheduled,
      completed,
      totalPlayers
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

App.put("/api/tournaments/:id", async (req, res) => {
  try {
    const { Tournament } = await import("../Models/Tournament");
    const { id } = req.params;
    const updates = req.body;

    const tournament = await Tournament.findOne({ TournamentId: id });
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    if (updates.name) tournament.TournamentName = updates.name;
    if (updates.startTime) tournament.StartTime = new Date(updates.startTime);
    if (updates.region !== undefined) tournament.Region = updates.region.toString();
    if (updates.map) tournament.Phases[0].Maps = [updates.map];

    await tournament.save();

    res.json({
      success: true,
      message: "Tournament updated successfully",
      tournament
    });
  } catch (error: any) {
    console.error("Error updating tournament:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tournament"
    });
  }
});

App.get("/api/tournaments/:id/players", async (req, res) => {
  try {
    const { BackboneUser } = await import("../Models/BackboneUser");
    const { id } = req.params;

    const players = await BackboneUser.find({
      [`Tournaments.${id}.SignedUp`]: true
    }).lean();

    const formatted = players.map((p: any) => ({
      userId: p.UserId,
      username: p.Username,
      signedUp: p.Tournaments[id]?.SignedUp,
      status: p.Tournaments[id]?.Status,
      partyCode: p.Tournaments[id]?.PartyCode,
      partyMembers: p.Tournaments[id]?.PartyMembers || [],
      finalPlace: p.Tournaments[id]?.FinalPlace || 0
    }));

    res.json({
      success: true,
      players: formatted,
      count: formatted.length
    });
  } catch (error: any) {
    console.error("Error fetching tournament players:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch players"
    });
  }
});

App.post("/api/tournaments/:id/start", async (req, res) => {
  try {
    const { Tournament } = await import("../Models/Tournament");
    const { id } = req.params;

    const tournament = await Tournament.findOne({ TournamentId: id });
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    if (tournament.Status !== 0) {
      return res.status(400).json({
        success: false,
        message: "Tournament is not scheduled or already started"
      });
    }

    tournament.Status = 1;
    tournament.StartTime = new Date();
    await tournament.save();

    res.json({
      success: true,
      message: "Tournament started successfully",
      tournament
    });
  } catch (error: any) {
    console.error("Error starting tournament:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start tournament"
    });
  }
});

App.post("/api/tournaments/:id/cancel", async (req, res) => {
  try {
    const { Tournament } = await import("../Models/Tournament");
    const { id } = req.params;

    const tournament = await Tournament.findOne({ TournamentId: id });
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found"
      });
    }

    tournament.Status = 2;
    await tournament.save();

    res.json({
      success: true,
      message: "Tournament cancelled successfully",
      tournament
    });
  } catch (error: any) {
    console.error("Error cancelling tournament:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel tournament"
    });
  }
});

// ============= PLAYER MANAGEMENT APIs =============

App.get("/api/tournaments/:id/players/detailed", async (req, res) => {
  try {
    const { getTournamentPlayers } = await import("../Services/PlayerService");
    const { id } = req.params;
    const players = await getTournamentPlayers(id);
    res.json({ success: true, players, count: players.length });
  } catch (error: any) {
    console.error("Error fetching players:", error);
    res.status(500).json({ success: false, message: "Failed to fetch players" });
  }
});

App.post("/api/tournaments/:id/players/add", async (req, res) => {
  try {
    const { addPlayerToTournament } = await import("../Services/PlayerService");
    const { id } = req.params;
    const { userId, username } = req.body;

    if (!userId || !username) {
      return res.status(400).json({ success: false, message: "userId and username are required" });
    }

    const result = await addPlayerToTournament(id, userId, username);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error: any) {
    console.error("Error adding player:", error);
    res.status(500).json({ success: false, message: "Failed to add player" });
  }
});

App.delete("/api/tournaments/:id/players/:playerId", async (req, res) => {
  try {
    const { removePlayerFromTournament } = await import("../Services/PlayerService");
    const { id, playerId } = req.params;
    const result = await removePlayerFromTournament(id, playerId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error: any) {
    console.error("Error removing player:", error);
    res.status(500).json({ success: false, message: "Failed to remove player" });
  }
});

App.post("/api/tournaments/:id/players/:playerId/reset", async (req, res) => {
  try {
    const { resetPlayerInTournament } = await import("../Services/PlayerService");
    const { id, playerId } = req.params;
    const result = await resetPlayerInTournament(id, playerId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error: any) {
    console.error("Error resetting player:", error);
    res.status(500).json({ success: false, message: "Failed to reset player" });
  }
});

App.get("/api/players/:playerId/stats", async (req, res) => {
  try {
    const { getPlayerStats } = await import("../Services/PlayerService");
    const stats = await getPlayerStats(req.params.playerId);
    if (!stats.player) return res.status(404).json({ success: false, message: "Player not found" });
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error("Error fetching player stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch player stats" });
  }
});

App.get("/api/players/leaderboard", async (req, res) => {
  try {
    const { getTopPlayers } = await import("../Services/PlayerService");
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await getTopPlayers(Math.min(limit, 100));
    res.json({ success: true, leaderboard, count: leaderboard.length });
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ success: false, message: "Failed to fetch leaderboard" });
  }
});

// ============= TEAM MANAGEMENT APIs =============

App.get("/api/tournaments/:id/teams", async (req, res) => {
  try {
    const { getTournamentTeams } = await import("../Services/PlayerService");
    const teams = await getTournamentTeams(req.params.id);
    res.json({ success: true, teams, count: teams.length });
  } catch (error: any) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ success: false, message: "Failed to fetch teams" });
  }
});

App.get("/api/tournaments/:id/players/:playerId/team", async (req, res) => {
  try {
    const { getPlayerTeam } = await import("../Services/PlayerService");
    const team = await getPlayerTeam(req.params.id, req.params.playerId);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    res.json({ success: true, team });
  } catch (error: any) {
    console.error("Error fetching player team:", error);
    res.status(500).json({ success: false, message: "Failed to fetch team" });
  }
});

// ============= MATCH MANAGEMENT APIs =============

App.get("/api/tournaments/:id/matches", async (req, res) => {
  try {
    const { getTournamentMatches } = await import("../Services/MatchService");
    const { phase, round } = req.query;
    const matches = await getTournamentMatches(
      req.params.id,
      phase ? parseInt(phase as string) : undefined,
      round ? parseInt(round as string) : undefined
    );
    res.json({ success: true, matches, count: matches.length });
  } catch (error: any) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ success: false, message: "Failed to fetch matches" });
  }
});

App.get("/api/tournaments/:id/bracket", async (req, res) => {
  try {
    const { getTournamentBracket } = await import("../Services/MatchService");
    const bracket = await getTournamentBracket(req.params.id);
    if (!bracket.tournament) return res.status(404).json({ success: false, message: "Tournament not found" });
    res.json({ success: true, bracket });
  } catch (error: any) {
    console.error("Error fetching bracket:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bracket" });
  }
});

App.get("/api/tournaments/:id/matches/stats", async (req, res) => {
  try {
    const { getMatchStats } = await import("../Services/MatchService");
    const stats = await getMatchStats(req.params.id);
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error("Error fetching match stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch match stats" });
  }
});

App.put("/api/matches/:matchId/status", async (req, res) => {
  try {
    const { updateMatchStatus } = await import("../Services/MatchService");
    const { status } = req.body;
    if (status === undefined) return res.status(400).json({ success: false, message: "status is required" });
    const result = await updateMatchStatus(req.params.matchId, parseInt(status));
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error: any) {
    console.error("Error updating match status:", error);
    res.status(500).json({ success: false, message: "Failed to update match" });
  }
});

App.post("/api/matches/:matchId/winner", async (req, res) => {
  try {
    const { setMatchWinner } = await import("../Services/MatchService");
    const { teamId } = req.body;
    if (!teamId) return res.status(400).json({ success: false, message: "teamId is required" });
    const result = await setMatchWinner(req.params.matchId, teamId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error: any) {
    console.error("Error setting match winner:", error);
    res.status(500).json({ success: false, message: "Failed to set match winner" });
  }
});

App.post("/api/matches/:matchId/reset", async (req, res) => {
  try {
    const { resetMatch } = await import("../Services/MatchService");
    const result = await resetMatch(req.params.matchId);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (error: any) {
    console.error("Error resetting match:", error);
    res.status(500).json({ success: false, message: "Failed to reset match" });
  }
});

// ============= ADMIN: PLAYER NAME MANAGEMENT =============

App.get("/api/admin/player/search", async (req, res) => {
  try {
    const admin = await getUserFromToken(req);
    if (!admin) return res.status(401).json({ success: false, message: "Not authenticated" });
    if (admin.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required" });

    const q = (req.query.q as string || "").trim();
    if (!q) return res.status(400).json({ success: false, message: "Search query required" });

    const mongoose = await import("mongoose");
    const db = mongoose.connection.db!;
    const users = db.collection("Users");

    const orFilters: any[] = [
      { username: { $regex: q, $options: "i" } },
    ];
    const numericQ = parseInt(q);
    if (!isNaN(numericQ)) {
      orFilters.push({ stumbleId: numericQ });
    }

    const results = await users
      .find({ $or: orFilters })
      .limit(50)
      .project({ _id: 1, username: 1, stumbleId: 1, credits: 1, role: 1 })
      .toArray();

    res.json({ success: true, players: results });
  } catch (error: any) {
    console.error("Error searching players:", error);
    res.status(500).json({ success: false, message: "Failed to search players" });
  }
});

App.get("/api/admin/player/:id", async (req, res) => {
  try {
    const admin = await getUserFromToken(req);
    if (!admin) return res.status(401).json({ success: false, message: "Not authenticated" });
    if (admin.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required" });

    const { ObjectId } = await import("mongodb");
    let objectId;
    try {
      objectId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid player ID" });
    }

    const mongoose = await import("mongoose");
    const db = mongoose.connection.db!;
    const users = db.collection("Users");

    const player = await users.findOne(
      { _id: objectId },
      { projection: { _id: 1, username: 1, stumbleId: 1, credits: 1, role: 1, deviceId: 1, userProfile: 1 } }
    );

    if (!player) return res.status(404).json({ success: false, message: "Player not found" });

    res.json({ success: true, player });
  } catch (error: any) {
    console.error("Error fetching player:", error);
    res.status(500).json({ success: false, message: "Failed to fetch player" });
  }
});

App.post("/api/admin/player/rename", async (req, res) => {
  try {
    const admin = await getUserFromToken(req);
    if (!admin) return res.status(401).json({ success: false, message: "Not authenticated" });
    if (admin.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required" });

    const { playerId, newUsername, color } = req.body;

    if (!playerId || !newUsername) {
      return res.status(400).json({ success: false, message: "playerId and newUsername are required" });
    }

    if (typeof newUsername !== "string" || newUsername.length < 4 || newUsername.length > 12) {
      return res.status(400).json({ success: false, message: "Username must be 4-12 characters" });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      return res.status(400).json({ success: false, message: "Username can only contain letters, numbers, and underscores" });
    }

    const { ObjectId } = await import("mongodb");
    let objectId;
    try {
      objectId = new ObjectId(playerId);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid player ID" });
    }

    const mongoose = await import("mongoose");
    const db = mongoose.connection.db!;
    const users = db.collection("Users");

    const existing = await users.findOne({ username: newUsername });
    if (existing) {
      return res.status(400).json({ success: false, message: "Username already taken" });
    }

    const updateFields: any = { username: newUsername };
    if (color && typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      updateFields.nameColor = color;
    }

    const result = await users.findOneAndUpdate(
      { _id: objectId },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) return res.status(404).json({ success: false, message: "Player not found" });

    console.log(`Admin ${admin.username} renamed player ${playerId} to ${newUsername}`);

    res.json({ success: true, message: `Player renamed to ${newUsername}`, player: { _id: result._id, username: result.username, stumbleId: result.stumbleId } });
  } catch (error: any) {
    console.error("Error renaming player:", error);
    res.status(500).json({ success: false, message: "Failed to rename player" });
  }
});

// ============= INTERNAL API: Tournaments for game backend =============

App.get("/api/internal/tournaments", async (req, res) => {
  try {
    const { Tournament } = await import("../Models/Tournament");
    const tournaments = await Tournament.find({ Status: { $in: [0, 1] } }).lean();
    res.json({ success: true, tournaments });
  } catch (error: any) {
    console.error("Error fetching internal tournaments:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tournaments" });
  }
});

export default {
  App,
  DefaultAPI: "/",
};
