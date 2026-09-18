import { Request, Response, NextFunction } from "express";
import { Session } from "../Models/Session";
import { User } from "../Models/User";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        credits: number;
        role: string;
      };
      session?: {
        token: string;
      };
    }
  }
}

export async function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from header or cookie
    const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "No authentication token provided" 
      });
    }

    // Find session
    const session = await Session.findOne({ 
      token, 
      expiresAt: { $gt: new Date() } 
    });

    if (!session) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid or expired session" 
      });
    }

    // Find user
    const user = await User.findById(session.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      username: user.username,
      credits: user.credits,
      role: user.role
    };

    req.session = {
      token: token
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Authentication error" 
    });
  }
}

export async function AdminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: "Authentication required" 
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ 
      success: false,
      message: "Admin access required" 
    });
  }

  next();
}
