// Test-only helper: signs in against the local Auth emulator's REST API to obtain a real
// ID token, the same way a browser client would. `admin.auth()` alone can't produce one —
// it mints custom tokens, not ID tokens, and our middleware verifies ID tokens.
const AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';

export async function signInAndGetIdToken(email: string, password: string): Promise<string> {
  const res = await fetch(
    `http://${AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  if (!res.ok) {
    throw new Error(`Auth emulator sign-in failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { idToken: string };
  return data.idToken;
}
