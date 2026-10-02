#!/usr/bin/env node
/**
 * Seeds realistic-looking placeholder content so the site isn't empty during local dev/demo:
 * site settings, a few accommodations, and some gallery photos. Safe to re-run — it always
 * overwrites the same fixed document IDs rather than appending duplicates each time.
 *
 * Usage:
 *   node scripts/seed-dummy-data.js --emulator   # local emulators only — refuses to run otherwise
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

const SITE_SETTINGS = {
  heroHeadline: 'Persada Hills Homestay',
  heroSubheadline: 'A quiet hillside retreat surrounded by nature — the perfect base for your next getaway.',
  heroImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&q=80',
  aboutContent:
    'Persada Hills Homestay is a family-run getaway tucked into the highlands, five minutes from the town centre. ' +
    'We built this place to feel like a second home — quiet mornings with the mist still on the hills, a garden to ' +
    'have your coffee in, and rooms that are comfortable without trying too hard. Whether you are here for a ' +
    'weekend away or a longer stay, we would love to host you.',
  hostIntro:
    "We're the Ismail family, and we've been welcoming guests to this house since 2019. We live just next door, " +
    "so if you need anything during your stay — directions, recommendations, an extra blanket — just ask.",
  address: '12, Jalan Bukit Damai, 39000 Tanah Rata, Cameron Highlands, Pahang, Malaysia',
  geo: { lat: 4.4712, lng: 101.3801 },
  contactEmail: 'stay@persadahills.example.com',
  contactPhone: '+60123456789',
  socialLinks: [
    { platform: 'Instagram', url: 'https://instagram.com/persadahills' },
    { platform: 'Facebook', url: 'https://facebook.com/persadahills' },
  ],
  checkInTime: '14:00',
  checkOutTime: '12:00',
  houseRules: [
    'No smoking indoors',
    'No pets allowed',
    'Quiet hours from 11pm to 7am',
    'Please remove shoes before entering the house',
    'Maximum occupancy as booked — extra guests must be arranged in advance',
  ],
  faqs: [
    {
      order: 0,
      question: 'Is parking available?',
      answer: 'Yes, free parking for up to 3 cars right outside the house.',
    },
    {
      order: 1,
      question: 'Is WiFi included?',
      answer: 'Yes, free WiFi throughout the house.',
    },
    {
      order: 2,
      question: 'Is breakfast provided?',
      answer: 'Not included, but there are several good breakfast spots within a 5-minute drive, and each room has a kettle and basic tea/coffee.',
    },
    {
      order: 3,
      question: 'Can I check in early or check out late?',
      answer: 'Ask us directly — we\'ll do our best to accommodate, depending on bookings before/after yours.',
    },
  ],
  cancellationPolicy:
    'Free cancellation up to 3 days before check-in. Cancellations within 3 days of check-in are non-refundable. ' +
    'Contact us directly for date changes — we\'ll try to accommodate where possible.',
  seoDefaults: {
    title: 'Persada Hills Homestay — Cameron Highlands',
    description: 'A quiet hillside homestay in Cameron Highlands. Book your stay directly — no account needed.',
    shareImageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
  },
};

const ACCOMMODATIONS = [
  {
    slug: 'garden-view-room',
    name: 'Garden View Room',
    description:
      'A bright, simple room overlooking the back garden — ideal for a couple or solo traveller who just needs a ' +
      'comfortable, quiet place to sleep after a day out exploring the highlands.',
    photos: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80',
    ],
    capacity: 2,
    beds: 1,
    amenities: ['WiFi', 'Air conditioning', 'Hot shower', 'TV', 'Wardrobe'],
    basePrice: 150,
    minStay: 1,
    maxStay: 7,
    active: true,
  },
  {
    slug: 'family-suite',
    name: 'Family Suite',
    description:
      'Our largest room, with two bedrooms and a small living area — comfortable for a family or a small group ' +
      'travelling together. Includes a kitchenette for light cooking.',
    photos: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&q=80',
    ],
    capacity: 5,
    beds: 3,
    amenities: ['WiFi', 'Air conditioning', 'Kitchenette', 'Hot shower', 'TV', 'Extra towels'],
    basePrice: 320,
    minStay: 1,
    maxStay: 14,
    active: true,
    weekdayRates: [{ daysOfWeek: [5, 6], nightlyRate: 380 }],
  },
  {
    slug: 'cozy-cabin',
    name: 'Cozy Cabin',
    description:
      'A standalone cabin a short walk from the main house, with its own small porch — the most private option ' +
      'on the property, popular with couples celebrating something.',
    photos: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=80'],
    capacity: 3,
    beds: 2,
    amenities: ['WiFi', 'Heater', 'Hot shower', 'Private porch'],
    basePrice: 220,
    minStay: 2,
    maxStay: 10,
    active: true,
  },
];

const GALLERY_ITEMS = [
  {
    id: 'seed-gallery-1',
    cloudinaryPublicId: 'seed/placeholder-1',
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
    altText: 'The homestay exterior, surrounded by hillside greenery',
  },
  {
    id: 'seed-gallery-2',
    cloudinaryPublicId: 'seed/placeholder-2',
    url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&q=80',
    altText: 'View of the hills from the property',
  },
  {
    id: 'seed-gallery-3',
    cloudinaryPublicId: 'seed/placeholder-3',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
    altText: 'A guest bedroom with natural light',
  },
];

async function main() {
  const { emulator } = parseArgs();

  if (!emulator) {
    console.error('Refusing to run without --emulator (this seeds obviously fake placeholder data).');
    process.exitCode = 1;
    return;
  }

  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.GCLOUD_PROJECT ??= 'homestay-cms';

  initializeApp();
  const db = getFirestore();
  const now = Timestamp.now();

  await db.doc('siteSettings/main').set({ ...SITE_SETTINGS, updatedAt: now });
  console.log('Seeded siteSettings/main');

  for (const accommodation of ACCOMMODATIONS) {
    const existing = await db.collection('accommodations').where('slug', '==', accommodation.slug).limit(1).get();
    const ref = existing.empty ? db.collection('accommodations').doc() : existing.docs[0].ref;
    await ref.set({ ...accommodation, id: ref.id, createdAt: now, updatedAt: now });
    console.log(`Seeded accommodation: ${accommodation.name} (${ref.id})`);
  }

  for (const item of GALLERY_ITEMS) {
    await db
      .collection('media')
      .doc(item.id)
      .set({
        id: item.id,
        cloudinaryPublicId: item.cloudinaryPublicId,
        url: item.url,
        altText: item.altText,
        association: { type: 'gallery' },
        order: GALLERY_ITEMS.indexOf(item),
        createdAt: now,
      });
    console.log(`Seeded gallery item: ${item.altText}`);
  }

  console.log('\nDone. Note: gallery items use placeholder Cloudinary public IDs that do not correspond to real');
  console.log('assets — deleting them via the admin UI will fail once Cloudinary is configured for real. Fine for');
  console.log('local browsing; remove them manually from Firestore if that becomes annoying.');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
