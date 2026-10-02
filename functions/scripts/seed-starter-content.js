#!/usr/bin/env node
/**
 * One-time: puts neutral starter content (English + Bahasa Malaysia) on a new site so the public
 * pages are not empty before the owner has written their own:
 *   - site settings: no address, phone, email, photos or refund terms are invented;
 *   - two PLACEHOLDER rooms with stock photos and made-up sample prices — replace both in
 *     Admin > Accommodation before real guests book.
 * Source of truth: src/seed/starter-content.ts (compiled to lib/ by `npm run build`).
 *
 * It will NOT overwrite settings or rooms that already exist unless you pass --force, so it
 * cannot wipe work done in the admin. Settings and rooms are checked independently.
 *
 * Flags: --no-rooms skips the placeholder rooms.
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
    return require('../lib/seed/starter-content');
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      console.error('Could not find lib/seed/starter-content.js — run `npm run build` first.');
      process.exit(1);
    }
    throw err;
  }
}

async function seedSettings(db, content, target, force) {
  const ref = db.doc('siteSettings/main');
  const existing = await ref.get();
  if (existing.exists && !force) {
    console.log(`Site settings already exist on ${target}. Left unchanged.`);
    return;
  }
  await ref.set({ ...content, updatedAt: Timestamp.now() });
  console.log(`${existing.exists ? 'Replaced' : 'Created'} starter site settings on ${target}.`);
}

async function seedRooms(db, rooms, target, force) {
  for (const room of rooms) {
    const ref = db.collection('accommodations').doc(room.id);
    const existing = await ref.get();
    if (existing.exists && !force) {
      console.log(`Room "${room.name}" already exists on ${target}. Left unchanged.`);
      continue;
    }

    // A room with the same slug under a different id (e.g. one the owner made by hand) would
    // make two rooms share a public URL; leave it alone rather than create a clash.
    const clash = await db.collection('accommodations').where('slug', '==', room.slug).get();
    if (clash.docs.some((doc) => doc.id !== room.id)) {
      console.log(`A room with the slug "${room.slug}" already exists on ${target}. Skipped "${room.name}".`);
      continue;
    }

    const now = Timestamp.now();
    await ref.set({ ...room, createdAt: existing.exists ? existing.data().createdAt : now, updatedAt: now });
    console.log(`${existing.exists ? 'Replaced' : 'Created'} placeholder room "${room.name}" on ${target}.`);
  }
}

async function main() {
  const { project, emulator, force } = parseArgs();
  const withRooms = !process.argv.includes('--no-rooms');

  if (emulator) {
    process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
    process.env.GCLOUD_PROJECT ??= typeof project === 'string' ? project : 'homestay-cms';
  } else if (typeof project !== 'string' || !project) {
    console.error('Pass --project=<firebase-project-id> (or --emulator for local). Refusing to guess the target.');
    process.exit(1);
  }

  const { STARTER_CONTENT, STARTER_ROOMS } = loadStarterContent();

  initializeApp(emulator ? undefined : { projectId: project });
  const db = getFirestore();
  const target = emulator ? `emulator (${process.env.GCLOUD_PROJECT})` : `project "${project}"`;

  await seedSettings(db, STARTER_CONTENT, target, force);
  if (withRooms) {
    await seedRooms(db, STARTER_ROOMS, target, force);
    console.log('');
    console.log('!! The seeded rooms use STOCK PHOTOS and SAMPLE PRICES. They are not your property.');
    console.log('!! Open Admin > Accommodation and replace the photos, names and prices before real guests book.');
  }
  console.log('Next: open Admin > Site content and enter your real name, address, phone and email.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
