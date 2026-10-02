#!/usr/bin/env node
/**
 * One-time: puts neutral starter content (English + Bahasa Malaysia) on a new site's settings so
 * the public pages are not empty before the owner has written their own. It invents no address,
 * phone, prices, photos or refund terms, and creates no rooms — those are entered in the admin.
 * Source of truth: src/seed/starter-content.ts (compiled to lib/ by `npm run build`).
 *
 * It will NOT overwrite settings that already exist unless you pass --force, so it cannot wipe
 * work done in the admin.
 *
 * Usage (run `npm run build` first, from the functions/ folder):
 *   node scripts/seed-starter-content.js --project=homestay-cms            # your real project
 *   node scripts/seed-starter-content.js --emulator                        # local emulators
 *   node scripts/seed-starter-content.js --project=homestay-cms --force    # replace existing
 *
 * Against the real project this needs credentials: set GOOGLE_APPLICATION_CREDENTIALS to a
 * service-account key path (delete the key afterwards), or run `gcloud auth application-default login`.
 */
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    args[key] = value ?? true;
  }
  return args;
}

function loadStarterContent() {
  try {
    return require('../lib/seed/starter-content').STARTER_CONTENT;
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      console.error('Could not find lib/seed/starter-content.js — run `npm run build` first.');
      process.exit(1);
    }
    throw err;
  }
}

async function main() {
  const { project, emulator, force } = parseArgs();

  if (emulator) {
    process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
    process.env.GCLOUD_PROJECT ??= typeof project === 'string' ? project : 'homestay-cms';
  } else if (typeof project !== 'string' || !project) {
    console.error('Pass --project=<firebase-project-id> (or --emulator for local). Refusing to guess the target.');
    process.exit(1);
  }

  const content = loadStarterContent();

  initializeApp(emulator ? undefined : { projectId: project });
  const db = getFirestore();
  const target = emulator ? `emulator (${process.env.GCLOUD_PROJECT})` : `project "${project}"`;

  const ref = db.doc('siteSettings/main');
  const existing = await ref.get();
  if (existing.exists && !force) {
    console.log(`Site settings already exist on ${target}. Nothing changed. Use --force to replace them.`);
    return;
  }

  await ref.set({ ...content, updatedAt: Timestamp.now() });
  console.log(`${existing.exists ? 'Replaced' : 'Created'} starter site settings on ${target}.`);
  console.log('Next: open Admin > Site content and enter your real name, address, phone and email.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
