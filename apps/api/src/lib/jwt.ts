import jwt from "jsonwebtoken";
import { config } from "./config";
import { AuthTokenPayload } from "@/middleware/auth.middleware";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

export function signAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(payload: Pick<AuthTokenPayload, "userId">) {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as { userId: string };
}
