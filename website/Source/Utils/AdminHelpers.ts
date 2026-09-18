// Admin Helper Functions

export const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || '1394118417275031672,1548373280438886444').split(',');

export function isAdmin(discordId: string): boolean {
  return ADMIN_IDS.includes(discordId);
}

export function isAdminRequest(req: any): boolean {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return false;
  
  try {
    const discordId = Buffer.from(token, 'base64').toString();
    return isAdmin(discordId);
  } catch {
    return false;
  }
}

export async function getOrCreateDashboardUser(discordId: string, username: string, DashboardUserModel: any) {
  const adminStatus = isAdmin(discordId);
  
  let user = await DashboardUserModel.findOne({ discordId });
  
  if (!user) {
    // Generate unique 5-digit ID
    const userId = await DashboardUserModel.generateUserId();
    const initialCredits = adminStatus ? 10000 : 0;
    
    user = await DashboardUserModel.create({
      userId,
      discordId,
      username,
      credits: initialCredits,
      tournamentsCreated: 0
    });
    
    console.log(`✅ New user: ${username} (${discordId}) - User ID: ${userId}`);
  } else {
    user.username = username;
    user.lastActivity = new Date();
    
    if (adminStatus && user.credits < 10000) {
      user.credits = 10000;
    }
    
    await user.save();
  }
  
  return { user, isAdmin: adminStatus };
}
