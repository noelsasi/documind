import { Request, Response, NextFunction } from "express";
import * as jose from "jose";

// JWT Payload from Stack Auth
export interface JWTPayload {
  sub: string; // User ID
  email?: string; // User email
  iat?: number; // Issued at
  exp?: number; // Expiration
  [key: string]: any; // Other potential claims
}

export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // @stackframe/react >= 2.8.108 uses "hexclave-access"; older versions used "stack-access"
    const cookies = req.cookies["hexclave-access"] ?? req.cookies["stack-access"];
    const parsedCookies = cookies ? JSON.parse(decodeURIComponent(cookies)) : [];
    const accessToken = parsedCookies[1];

    if (!accessToken) {
      res.status(401).json({
        message: "Access token not found",
        status: "unauthorized",
      });
      return;
    }

    const jwks = jose.createRemoteJWKSet(
      new URL(
        "https://api.stack-auth.com/api/v1/projects/2d70ed44-5be0-46d0-b90f-1a3acde23e02/.well-known/jwks.json"
      )
    );

    const { payload } = await jose.jwtVerify(accessToken, jwks);

    (req as AuthenticatedRequest).user = payload as any;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({
      message: "Invalid user",
      status: "unauthorized",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
