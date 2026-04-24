import { NextResponse, type NextRequest } from 'next/server';

// Basic-auth gate for the prototype URL (per S5 / P5 in the implementation
// plan). Enforced only when BOTH BASIC_AUTH_USER and BASIC_AUTH_PASS are set
// — local dev with neither set passes through unchanged.
//
// This is a prototype access deterrent, not production authentication. It
// runs edge-side on every request except static assets.

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  if (!user || !pass) {
    // Disabled — typical for local dev.
    return NextResponse.next();
  }

  const auth = req.headers.get('authorization');
  if (!auth) return unauthorized();

  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(':');
  if (sep === -1) return unauthorized();
  const providedUser = decoded.slice(0, sep);
  const providedPass = decoded.slice(sep + 1);

  if (providedUser !== user || providedPass !== pass) {
    return unauthorized();
  }

  return NextResponse.next();
}

function unauthorized(): NextResponse {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="NexTrade Prototype"',
    },
  });
}

export const config = {
  // Match everything except Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
