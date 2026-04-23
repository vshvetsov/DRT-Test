function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill in the value.`,
    );
  }
  return value;
}

function optional(name: string): string | null {
  const value = process.env[name];
  return value === undefined || value === '' ? null : value;
}

// Values are validated when accessed. That way a subsystem that only needs
// SESSION_SECRET (e.g. the session layer in dev) doesn't crash on a missing
// DATABASE_URL it never reads.
export const env = {
  get DATABASE_URL() {
    return required('DATABASE_URL');
  },
  get ANTHROPIC_API_KEY() {
    return required('ANTHROPIC_API_KEY');
  },
  get SESSION_SECRET() {
    const v = required('SESSION_SECRET');
    if (v.length < 32) {
      throw new Error(
        'SESSION_SECRET must be at least 32 characters. ' +
          'Generate one with: openssl rand -hex 32',
      );
    }
    return v;
  },
  get BASIC_AUTH_USER() {
    return optional('BASIC_AUTH_USER');
  },
  get BASIC_AUTH_PASS() {
    return optional('BASIC_AUTH_PASS');
  },
} as const;
