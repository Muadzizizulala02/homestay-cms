#!/usr/bin/env node
/**
 * One-time: puts neutral starter content (English + Bahasa Malaysia) on a new site so the public
 * pages are not empty before the owner has written their own:
 *   - site settings: a hero slideshow (5 s per photo) that doubles as the social-share image,
 *     plus starter Privacy policy and Terms text (linked from the footer);
 *   - a gallery;
 *   - three PLACEHOLDER rooms with photos and made-up sample prices.
 * No address, phone, email or refund terms are invented. ALL PHOTOS ARE STOCK IMAGES, NOT YOUR
 * PROPERTY, and the room prices are samples — replace them in the admin before real guests book.
 * Source of truth: src/seed/starter-content.ts (compiled to lib/ by `npm run build`).
 *
 * Images are uploaded into YOUR Cloudinary account (folder homestay/starter) using the
 * CLOUDINARY_* values from the environment or functions/.env, so they behave like photos you
 * uploaded yourself (served fast, deletable from the admin). If Cloudinary is not configured,
 * or you pass --no-upload, the original stock URLs are used instead.
 *
 * Nothing you already have is overwritten unless you pass --force:
 *   - settings that exist are left alone, except anything still EMPTY is filled in: the hero
 *     slideshow (only if the current hero is not your own photo), the share image, the interval,
 *     and the privacy / terms text in each language;
 *   - social links are never seeded: they are your accounts, so add them in the admin;
 *   - rooms that exist (or whose URL slug is taken) are skipped;
 *   - the gallery is only seeded when it has no photos yet.
 *
 * Flags: --no-rooms, --no-gallery, --no-upload, --force
 *        --upload   also upload to Cloudinary when running against --emulator (off by default so
 *                   local test runs never touch your real Cloudinary account)
 *
 * Usage (run `npm run build` first, from the functions/ folder):
 *   node scripts/seed-starter-content.js --project=homestay-cms            # your real project
 *   node scripts/seed-starter-content.js --emulator                        # local emulators
 *
 * Against the real project this needs Firebase credentials: set GOOGLE_APPLICATION_CREDENTIALS to
 * a service-account key path (delete the key afterwards), or run `gcloud auth application-default login`.
 */
const fs = require('node:fs');
const path = require('node:path');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const CLOUDINARY_FOLDER = 'homestay/starter';
const EXTERNAL_PREFIX = 'external/'; // marks media whose image is not a Cloudinary asset (see media.service.ts)

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    args[key] = value ?? true;
  }
  return args;
}

/** Reads CLOUDINARY_* from functions/.env without overriding real environment variables. Values are never printed. */
function loadCloudinaryEnv() {
  const file = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(file)) {
    return;
  }
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(CLOUDINARY_[A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

function cloudinaryConfigured() {
  const placeholder = (v) => !v || /REPLACE_ME|^\.\.\.$|^xxx$/i.test(v);
  return ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every((k) => !placeholder(process.env[k]));
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

/**
 * Returns resolve(sourceUrl, id) -> { url, publicId }. Uploads to Cloudinary (once per image) when
 * enabled; otherwise hands back the original stock URL, marked external so deleting it in the
 * admin never calls Cloudinary.
 */
function makeImageResolver(useCloudinary) {
  const cache = new Map();
  let cloudinary;
  if (useCloudinary) {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  return function resolve(sourceUrl, id) {
    if (!cache.has(sourceUrl)) {
      cache.set(
        sourceUrl,
        (async () => {
          if (!useCloudinary) {
            return { url: sourceUrl, publicId: `${EXTERNAL_PREFIX}${id}` };
          }
          const uploaded = await cloudinary.uploader.upload(sourceUrl, {
            public_id: `${CLOUDINARY_FOLDER}/${id}`,
            overwrite: true, // fixed ids: re-running refreshes the same asset instead of piling up copies
            resource_type: 'image',
          });
          console.log(`  uploaded ${id} to Cloudinary (${uploaded.public_id})`);
          // f_auto/q_auto: the browser gets WebP/AVIF at a sensible quality; width capped for the hero.
          const url = cloudinary.url(uploaded.public_id, {
            secure: true,
            fetch_format: 'auto',
            quality: 'auto',
            width: 1600,
            crop: 'limit',
          });
          return { url, publicId: uploaded.public_id };
        })()
      );
    }
    return cache.get(sourceUrl);
  };
}

/** True for an image this seed put there (Cloudinary starter folder or the original stock host). */
function isStarterImage(url) {
  return typeof url === 'string' && (url.includes('/homestay/starter/') || url.includes('images.unsplash.com'));
}

async function seedSettings(db, content, photos, heroIds, resolve, target, force) {
  const ref = db.doc('siteSettings/main');
  const existing = await ref.get();
  const sourceOf = (id) => photos.find((p) => p.id === id).sourceUrl;
  const resolveSlides = async () => Promise.all(heroIds.map(async (id) => (await resolve(sourceOf(id), id)).url));

  if (!existing.exists || force) {
    const slides = await resolveSlides();
    await ref.set({
      ...content,
      heroImageUrl: slides[0],
      heroImages: slides,
      seoDefaults: { ...content.seoDefaults, shareImageUrl: slides[0] },
      updatedAt: Timestamp.now(),
    });
    console.log(`${existing.exists ? 'Replaced' : 'Created'} starter site settings on ${target} (${slides.length}-photo hero slideshow, ${content.heroIntervalSeconds}s per photo).`);
    return;
  }

  // Settings already exist: never touch the owner's content; only fill in what is still empty.
  const data = existing.data();
  const update = {};
  const filled = [];
  const ownerHero = !!data.heroImageUrl && !isStarterImage(data.heroImageUrl);
  const hasSlides = Array.isArray(data.heroImages) && data.heroImages.length > 0;

  if (!hasSlides && !ownerHero) {
    const slides = await resolveSlides();
    update.heroImages = slides;
    if (!data.heroImageUrl) update.heroImageUrl = slides[0];
    filled.push(`hero slideshow (${slides.length} photos)`);
  }
  const effectiveHero = update.heroImageUrl || data.heroImageUrl;
  if (!(data.seoDefaults && data.seoDefaults.shareImageUrl) && effectiveHero) {
    update.seoDefaults = { ...(data.seoDefaults || {}), shareImageUrl: effectiveHero };
    filled.push('share image');
  }
  if (typeof data.heroIntervalSeconds !== 'number') {
    update.heroIntervalSeconds = content.heroIntervalSeconds;
    filled.push('slideshow interval');
  }
  const ms = (data.translations && data.translations.ms) || {};
  for (const [field, label] of [['privacyPolicy', 'privacy policy'], ['termsAndConditions', 'terms']]) {
    if (!data[field]) {
      update[field] = content[field];
      filled.push(label);
    }
    if (!ms[field]) {
      update[`translations.ms.${field}`] = content.translations.ms[field];
      filled.push(`${label} (Malay)`);
    }
  }

  if (filled.length === 0) {
    console.log(`Site settings already exist on ${target}. Left unchanged.`);
    return;
  }
  update.updatedAt = Timestamp.now();
  await ref.update(update);
  console.log(`Site settings already exist on ${target}; filled in only what was missing: ${filled.join(', ')}.`);
}

async function seedRooms(db, rooms, photos, resolve, target, force) {
  const idBySource = new Map(photos.map((p) => [p.sourceUrl, p.id]));
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

    const roomPhotos = [];
    for (const source of room.photos) {
      roomPhotos.push((await resolve(source, idBySource.get(source))).url);
    }

    const now = Timestamp.now();
    await ref.set({ ...room, photos: roomPhotos, createdAt: existing.exists ? existing.data().createdAt : now, updatedAt: now });
    console.log(`${existing.exists ? 'Replaced' : 'Created'} placeholder room "${room.name}" on ${target}.`);
  }
}

async function seedGallery(db, gallery, photos, resolve, target, force) {
  const hasAny = await db.collection('media').where('association.type', '==', 'gallery').limit(1).get();
  if (!hasAny.empty && !force) {
    console.log(`The gallery on ${target} already has photos. Left unchanged.`);
    return;
  }

  for (const [index, item] of gallery.entries()) {
    const ref = db.collection('media').doc(item.id);
    const image = await resolve(photos.find((p) => p.id === item.photoId).sourceUrl, item.photoId);
    await ref.set({
      id: item.id,
      cloudinaryPublicId: image.publicId,
      url: image.url,
      altText: item.altText,
      association: { type: 'gallery' },
      order: index,
      createdAt: Timestamp.now(),
    });
  }
  console.log(`Seeded ${gallery.length} gallery photos on ${target}.`);
}

async function main() {
  const { project, emulator, force } = parseArgs();
  const has = (flag) => process.argv.includes(flag);

  if (emulator) {
    process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
    process.env.GCLOUD_PROJECT ??= typeof project === 'string' ? project : 'homestay-cms';
  } else if (typeof project !== 'string' || !project) {
    console.error('Pass --project=<firebase-project-id> (or --emulator for local). Refusing to guess the target.');
    process.exit(1);
  }

  loadCloudinaryEnv();
  const wantUpload = !has('--no-upload') && (!emulator || has('--upload'));
  const useCloudinary = wantUpload && cloudinaryConfigured();
  if (wantUpload && !useCloudinary) {
    console.log('Cloudinary is not configured (CLOUDINARY_* in the environment or functions/.env): using the original stock image URLs instead.');
  }
  console.log(useCloudinary ? 'Images: uploading to your Cloudinary account.' : 'Images: using the original stock URLs (no upload).');

  const { STARTER_CONTENT, STARTER_ROOMS, STARTER_GALLERY, STARTER_PHOTOS, STARTER_HERO_PHOTO_IDS } = loadStarterContent();

  initializeApp(emulator ? undefined : { projectId: project });
  const db = getFirestore();
  const target = emulator ? `emulator (${process.env.GCLOUD_PROJECT})` : `project "${project}"`;
  const resolve = makeImageResolver(useCloudinary);

  await seedSettings(db, STARTER_CONTENT, STARTER_PHOTOS, STARTER_HERO_PHOTO_IDS, resolve, target, force);
  if (!has('--no-gallery')) {
    await seedGallery(db, STARTER_GALLERY, STARTER_PHOTOS, resolve, target, force);
  }
  if (!has('--no-rooms')) {
    await seedRooms(db, STARTER_ROOMS, STARTER_PHOTOS, resolve, target, force);
  }

  console.log('');
  console.log('!! All seeded photos are STOCK IMAGES and the room prices are SAMPLES. They are not your property.');
  console.log('!! Replace them in Admin > Accommodation, Admin > Gallery and Admin > Site content before real guests book.');
  console.log('The privacy policy and terms are generic starter text, not legal advice: read and adjust them in Admin > Site content.');
  console.log('Social media links are not seeded (they are your own accounts): add them in Admin > Site content > Social media.');
  console.log('Next: open Admin > Site content and enter your real name, address, phone and email.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
