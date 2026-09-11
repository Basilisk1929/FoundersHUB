import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { SessionUser } from '@/types';

function getJwtSecret(): string {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  // Safe ephemeral secret fallback for dev/testing with warning
  const globalWithSecret = global as typeof globalThis & { _fhEphemeralSecret?: string };
  if (!globalWithSecret._fhEphemeralSecret) {
    console.warn('[Security] JWT_SECRET not set in environment. Using securely generated ephemeral secret.');
    globalWithSecret._fhEphemeralSecret = crypto.randomBytes(32).toString('hex');
  }
  return globalWithSecret._fhEphemeralSecret;
}

const JWT_EXPIRES_IN = '7d';
const JWT_ALGORITHM = 'HS256';

export function signSessionToken(user: SessionUser): string {
  return jwt.sign(
    {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl,
      theme: user.theme || 'dark'
    },
    getJwtSecret(),
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'foundershub'
    }
  );
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      algorithms: [JWT_ALGORITHM],
      issuer: 'foundershub'
    }) as any;

    if (!decoded || !decoded.userId || !decoded.role) {
      return null;
    }

    return {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      photoUrl: decoded.photoUrl,
      theme: decoded.theme
    };
  } catch {
    return null;
  }
}
