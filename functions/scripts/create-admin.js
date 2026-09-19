#!/usr/bin/env node
/**
 * One-time admin provisioning script — run locally, never deployed as a Cloud Function.
 * There is no public registration endpoint by design (see docs/ARCHITECTURE.md), so this
 * is how the homestay owner's first (and any subsequent) admin account gets created.
 *
 * Usage:
 *   node scripts/create-admin.js --email=owner@example.com --password=... --emulator
 *   node scripts/create-admin.js --email=owner@example.com --password=...   # against production
 *
 * Against production this needs credentials: set GOOGLE_APPLICATION_CREDENTIALS to a
 * service account key path, or run `gcloud auth application-default login` first.
 */
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    args[key] = value ?? true;
  }
  return args;
}

async function main() {
  const { email, password, emulator, project } = parseArgs();

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    console.error(
      'Usage: node scripts/create-admin.js --email=<email> --password=<password> [--emulator] [--project=<id>]'
    );
    process.exitCode = 1;
    return;
  }

  if (emulator) {
    process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
    // Must match the project the running `firebase emulators:start` instance is serving —
    // that's .firebaserc's default ("homestay-cms") unless a different --project was passed
    // to that command too. The automated test suite uses its own throwaway "demo-test"
    // project and never touches this script.
    process.env.GCLOUD_PROJECT ??= typeof project === 'string' ? project : 'homestay-cms';
  }

  initializeApp();
  const auth = getAuth();

  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`Found existing user ${user.uid} for ${email}`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') {
      throw err;
    }
    user = await auth.createUser({ email, password, emailVerified: true });
    console.log(`Created new user ${user.uid} for ${email}`);
  }

  await auth.setCustomUserClaims(user.uid, { role: 'admin' });
  console.log(`Granted role: admin to ${email} (${user.uid})`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
