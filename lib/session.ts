import { getIronSession, type IronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { env } from './env';

export type SessionData = {
  vendorId?: string;
  displayName?: string;
};

export function sessionOptions(): SessionOptions {
  return {
    password: env.SESSION_SECRET,
    cookieName: 'nxt_session',
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 12,
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(cookies(), sessionOptions());
}
