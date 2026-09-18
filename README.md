# Stumble Arab

Online tournament system for Stumble Guys.

## Structure
- `backend/` - Game backend API (port 3000)
- `website/` - Tournament website + API (port 8080)
- `bot/` - Discord bot for managing tournaments

## Deploy to Railway
1. Create 3 Railway services from this repo
2. Set root directory for each: `backend`, `website`, `bot`
3. Add environment variables (see `.env.example` in each folder)
