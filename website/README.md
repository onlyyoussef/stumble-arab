# 🏆 TOTBONE Tournament System

> Professional tournament management system for competitive gaming

## 📋 Overview

TOTBONE (formerly PrixBone) is a comprehensive tournament management system built with TypeScript, Express, MongoDB, and Discord.js. It supports 1v1, 2v2, 3v3, and 4v4 tournament formats with automated bracket generation, match tracking, and a full-featured dashboard.

## ✨ Features

### 🎮 Tournament Management
- **Multiple Formats**: 1v1, 2v2, 3v3, 4v4 tournaments
- **Automated Brackets**: Single/double elimination, round-robin
- **Team Support**: Full team management with party system
- **Match Tracking**: Real-time match status and scoring
- **Scheduling**: Schedule tournaments for future dates
- **Prize Pools**: Configurable prize distribution

### 📊 Dashboard
- **Tournament Creation**: Wizard-based tournament setup
- **Live Monitoring**: Real-time tournament status
- **Team Management**: View and manage teams
- **Player Management**: Add/remove/reset players
- **Bracket Visualization**: Interactive bracket view
- **Statistics**: Comprehensive tournament statistics

### 🤖 Discord Bot
- **22 Slash Commands**: Full tournament control via Discord
- **Automated Notifications**: Tournament updates via webhooks
- **Player Management**: Sign up, team formation, match notifications
- **Admin Tools**: Tournament moderation and management

### 💳 Credits System
- **User Credits**: Credit-based tournament creation
- **Admin Panel**: Credit management for users
- **Auto-deduction**: 1 credit per tournament

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB database
- Discord bot (optional)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd clean_project

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Build TypeScript
npm run build

# Start server
npm start
```

### Environment Variables

```env
DATABASE_URI="mongodb://..."
PORT=8080
PROJECT_NAME="Tournament-SDK"

# Discord Bot (Optional)
BOT_TOKEN="..."
BOT_APP_ID="..."
BOT_GUILD_ID="..."
AUTHORIZED_USERS="discordId1,discordId2"

# Webhooks
WEBHOOK_URI="..."
HALL_OF_FAME_WEBHOOK="..."
LEADERBOARD_WEBHOOK="..."

# Security
JWT_SECRET="..."
ADMIN_API_KEY="..."
```

## 📁 Project Structure

```
clean_project/
├── Source/
│   ├── Services/           # Business logic layer
│   │   ├── TournamentService.ts
│   │   ├── PlayerService.ts
│   │   └── MatchService.ts
│   ├── Routes/
│   │   └── Root.ts         # 26 API endpoints
│   ├── Models/             # MongoDB schemas
│   ├── Handlers/           # Bot, Server, Database
│   └── Backbone/           # Core tournament logic
├── public/
│   ├── dashboard.html
│   └── assets/
│       └── dashboard-simple.js
└── bin/                    # Compiled JavaScript
```

## 🔌 API Endpoints

### Tournaments
- `POST /api/tournaments/create` - Create tournament
- `GET /api/tournaments` - List all tournaments
- `GET /api/tournaments/:id` - Get tournament details
- `PUT /api/tournaments/:id` - Update tournament
- `DELETE /api/tournaments/:id` - Delete tournament
- `POST /api/tournaments/:id/start` - Start tournament
- `POST /api/tournaments/:id/cancel` - Cancel tournament

### Players
- `GET /api/tournaments/:id/players/detailed` - Get players
- `POST /api/tournaments/:id/players/add` - Add player
- `DELETE /api/tournaments/:id/players/:playerId` - Remove player
- `POST /api/tournaments/:id/players/:playerId/reset` - Reset player
- `GET /api/players/:playerId/stats` - Player statistics
- `GET /api/players/leaderboard` - Top players

### Teams
- `GET /api/tournaments/:id/teams` - Get all teams
- `GET /api/tournaments/:id/players/:playerId/team` - Get player's team

### Matches
- `GET /api/tournaments/:id/matches` - Get matches
- `GET /api/tournaments/:id/bracket` - Get bracket structure
- `GET /api/tournaments/:id/matches/stats` - Match statistics
- `PUT /api/matches/:matchId/status` - Update match status
- `POST /api/matches/:matchId/winner` - Set match winner
- `POST /api/matches/:matchId/reset` - Reset match

### Dashboard
- `POST /api/dashboard/user` - Get/create user
- `GET /api/dashboard/users` - List all users
- `POST /api/dashboard/credits/update` - Update credits
- `GET /api/stats` - Server statistics

## 🎯 Team Size Logic (CRITICAL FIX)

**Correct XvX Format:**
- **1v1**: 1 player per team × 2 teams = 2 players per match
- **2v2**: 2 players per team × 2 teams = 4 players per match
- **3v3**: 3 players per team × 2 teams = 6 players per match
- **4v4**: 4 players per team × 2 teams = 8 players per match

**Validation:**
- Team sizes: 1, 2, 3, or 4 only
- Max participants must be divisible by team size
- Result must be power-of-2 teams (2, 4, 8, 16, 32, 64, 128, 256)

## 🤖 Discord Bot Commands

```
/create-tournament  - Create tournament with full options
/list              - List tournaments with filters
/info              - Detailed tournament information
/players           - List players in tournament
/matches           - View matches
/edit              - Edit tournament settings
/cancel            - Cancel tournament
/delete            - Delete tournament permanently
/stats             - Server statistics
/winners           - Show tournament winners
/autowin           - Grant player automatic win
/kick              - Remove player from tournament
/addplayer         - Force-add player
/playerinfo        - Player history and stats
/schedule-list     - Pending scheduled tournaments
/announce          - Re-send webhook announcement
/duplicate         - Duplicate tournament
/setprizes         - Set prize pool
/top               - Top players leaderboard
/resetplayer       - Reset player data
/extend            - Extend tournament time
/leaderboard       - Send leaderboard to webhook
```

## 📊 Database Schema

### Tournament
```typescript
{
  TournamentId: string
  TournamentName: string
  PartySize: number        // Players per team (1-4)
  MaxPlayersPerMatch: number
  MaxInvites: number
  CurrentInvites: number
  Phases: [{
    PhaseType: enum
    MaxTeams: number       // Team count, not player count
    Maps: string[]
    RoundCount: number
  }]
  Status: number          // 0=Scheduled, 1=Active, 2=Finished
  StartTime: Date
  ...
}
```

### BackboneUser (Players)
```typescript
{
  UserId: string
  Username: string
  Tournaments: {
    [tournamentId]: {
      SignedUp: boolean
      PartyCode: string    // Team identifier
      PartyMembers: [...]
      Status: number
      FinalPlace: number
    }
  }
}
```

### DashboardUser
```typescript
{
  discordId: string
  username: string
  credits: number
  tournamentsCreated: number
  isAdmin: boolean
}
```

## 🛡️ Security

- ✅ Environment variables for secrets
- ✅ Input validation on all endpoints
- ✅ Credit system to prevent abuse
- ✅ Admin-only operations protected
- ⚠️ Authentication is Discord ID-based (basic)
- 🔄 Additional security hardening planned

## 🧪 Testing

```bash
# Run TypeScript compiler
npm run check

# Build project
npm run build

# Start development server
npm run dev

# Start production server
npm start
```

### Manual Testing Checklist
- [ ] Create 1v1 tournament (2, 4, 8, 16, 32 players)
- [ ] Create 2v2 tournament (4, 8, 16, 32 players)
- [ ] Create 3v3 tournament (6, 12, 24, 48 players)
- [ ] Create 4v4 tournament (8, 16, 32, 64 players)
- [ ] Verify bracket generation
- [ ] Test team formation
- [ ] Test match progression
- [ ] Verify winner determination

## 📈 Performance

- MongoDB with indexed fields
- Efficient queries with lean()
- Promise.all for parallel operations
- Auto-refresh with 30s interval
- Optimized frontend bundle

## 🐛 Known Issues

1. **Bracket Generation** - Phase.ts needs team-aware updates
2. **TypeScript** - Some `any` types remain
3. **Testing** - No automated tests yet
4. **Auth** - Basic Discord ID auth needs improvement

## 🔄 Changelog

### v2.0.0 (Latest) - Major Refactoring
- ✅ Fixed 2v2/3v3/4v4 team size calculations
- ✅ Added TournamentService, PlayerService, MatchService
- ✅ Created 26 API endpoints
- ✅ Built comprehensive Dashboard UI
- ✅ Added team management system
- ✅ Implemented bracket visualization
- ✅ Added validation for all tournament types

### v1.0.0 - Initial Release
- Basic tournament system
- Discord bot integration
- Simple dashboard

## 👥 Contributing

This project is currently under active development. Contributions welcome after Phase 16 completion.

## 📝 License

[Add license information]

## 🙏 Credits

- **Developer**: Professional Software Engineer (AI-assisted refactoring)
- **Original Project**: PrixBone
- **New Project**: TOTBONE / Backbone Tournament System

## 📞 Support

For issues and questions:
- Check `PROJECT_STATUS.md` for current status
- Review API documentation
- Contact administrator for credits

---

**Status**: 8/16 Phases Complete (50%) | **Last Updated**: 2026-09-13
